"use server";

import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types/action-response";
import type { Product } from "@/generated/prisma/client";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  productFilterSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilterInput,
} from "@/lib/validations/product.schema";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type ProductWithSupplier = Product & {
  supplier: { id: string; name: string } | null;
};

type ProductListResult = {
  products: ProductWithSupplier[];
  total: number;
  page: number;
  totalPages: number;
};

// ──────────────────────────────────────────────
// GET PRODUCTS (List with filter, search, pagination)
// ──────────────────────────────────────────────

export async function getProducts(
  storeId: string,
  filter?: Partial<ProductFilterInput>
): Promise<ActionResponse<ProductListResult>> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const parsed = productFilterSchema.safeParse(filter ?? {});
    if (!parsed.success) {
      return {
        success: false,
        message: "Filter tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { search, supplierId, page, limit, sortBy, sortOrder } = parsed.data;

    const where = {
      storeId: storeDbId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
          { barcode: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(supplierId && { supplierId }),
    };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return {
      success: true,
      data: {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("[getProducts]", error);
    return { success: false, message: "Gagal memuat daftar produk" };
  }
}

// ──────────────────────────────────────────────
// GET PRODUCT BY ID
// ──────────────────────────────────────────────

export async function getProductById(
  storeId: string,
  productId: string
): Promise<ActionResponse<ProductWithSupplier>> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const product = await db.product.findFirst({
      where: { id: productId, storeId: storeDbId },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("[getProductById]", error);
    return { success: false, message: "Gagal memuat detail produk" };
  }
}

// ──────────────────────────────────────────────
// CREATE PRODUCT
// ──────────────────────────────────────────────

export async function createProduct(
  storeId: string,
  input: CreateProductInput
): Promise<ActionResponse<Product>> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const parsed = createProductSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data produk tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { supplierId, currentStock, ...data } = parsed.data;

    const product = await db.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          ...data,
          storeId: storeDbId,
          unit: data.unit || "PCS",
          currentStock,
          supplierId: supplierId || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
        },
      });

      // Create initial stock log if stock > 0
      if (currentStock > 0) {
        await tx.stockLog.create({
          data: {
            storeId: storeDbId,
            productId: newProduct.id,
            type: "IN",
            quantity: currentStock,
            stockBefore: 0,
            stockAfter: currentStock,
            notes: "Stok awal saat produk dibuat",
          },
        });
      }

      return newProduct;
    }, {
      maxWait: 10000, // 10 seconds max wait to acquire transaction lock
      timeout: 20000, // 20 seconds max execution time
    });

    return {
      success: true,
      message: "Produk berhasil ditambahkan",
      data: product,
    };
  } catch (error) {
    console.error("[createProduct]", error);
    return { success: false, message: "Gagal menambahkan produk" };
  }
}

// ──────────────────────────────────────────────
// UPDATE PRODUCT
// ──────────────────────────────────────────────

export async function updateProduct(
  storeId: string,
  input: UpdateProductInput
): Promise<ActionResponse<Product>> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const parsed = updateProductSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data produk tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { id, supplierId, ...data } = parsed.data;

    // Verify product belongs to this store
    const existing = await db.product.findFirst({
      where: { id, storeId: storeDbId },
    });

    if (!existing) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...data,
        unit: data.unit || "PCS",
        supplierId: supplierId || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
      },
    });

    return {
      success: true,
      message: "Produk berhasil diperbarui",
      data: product,
    };
  } catch (error) {
    console.error("[updateProduct]", error);
    return { success: false, message: "Gagal memperbarui produk" };
  }
}

// ──────────────────────────────────────────────
// DELETE PRODUCT
// ──────────────────────────────────────────────

export async function deleteProduct(
  storeId: string,
  input: { id: string }
): Promise<ActionResponse> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const parsed = deleteProductSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Verify product belongs to this store
    const existing = await db.product.findFirst({
      where: { id: parsed.data.id, storeId: storeDbId },
    });

    if (!existing) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    await db.product.delete({
      where: { id: parsed.data.id },
    });

    return { success: true, message: "Produk berhasil dihapus" };
  } catch (error) {
    console.error("[deleteProduct]", error);
    return { success: false, message: "Gagal menghapus produk" };
  }
}

// ──────────────────────────────────────────────
// GET SUPPLIERS (for product form dropdown)
// ──────────────────────────────────────────────

export async function getSuppliers(
  storeId: string
): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const suppliers = await db.supplier.findMany({
      where: { storeId: storeDbId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: suppliers };
  } catch (error) {
    console.error("[getSuppliers]", error);
    return { success: false, message: "Gagal memuat daftar supplier" };
  }
}
