import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { productFilterSchema, createProductSchema } from "@/lib/validations/product.schema";
import { validateStoreAccess } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    
    if (!storeId) {
      return NextResponse.json({ success: false, message: "storeId is required" }, { status: 400 });
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return NextResponse.json({ success: false, message: "Akses ke toko ditolak" }, { status: 403 });
    }

    const filter = {
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      unitId: searchParams.get("unitId") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const parsed = productFilterSchema.safeParse(filter);
    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { search, categoryId, unitId, page, limit, sortBy, sortOrder } = parsed.data;

    const where = {
      storeId: storeDbId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(unitId && { unitId }),
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { supplier: { select: { id: true, name: true } }, category: true, unit: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    
    if (!storeId) {
      return NextResponse.json({ success: false, message: "storeId is required" }, { status: 400 });
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    if (data.sku) {
      const existingSku = await db.product.findFirst({
        where: { storeId: storeDbId, sku: data.sku },
      });
      if (existingSku) {
        return NextResponse.json({ success: false, message: "SKU sudah digunakan" }, { status: 400 });
      }
    }

    if (data.barcode) {
      const existingBarcode = await db.product.findFirst({
        where: { storeId: storeDbId, barcode: data.barcode },
      });
      if (existingBarcode) {
        return NextResponse.json({ success: false, message: "Barcode sudah digunakan" }, { status: 400 });
      }
    }

    const product = await db.product.create({
      data: {
        ...data,
        storeId: storeDbId,
      },
    });

    return NextResponse.json({ success: true, message: "Produk berhasil ditambahkan", data: product });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
