import { z } from "zod";

// ──────────────────────────────────────────────
// CREATE PRODUCT
// ──────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Nama produk wajib diisi")
    .max(200, "Nama produk maksimal 200 karakter"),
  sku: z
    .string()
    .max(50, "SKU maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  barcode: z
    .string()
    .max(50, "Barcode maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  unitId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  buyPrice: z
    .number({ error: "Harga beli harus berupa angka" })
    .min(0, "Harga beli tidak boleh negatif"),
  sellPrice: z
    .number({ error: "Harga jual harus berupa angka" })
    .min(0, "Harga jual tidak boleh negatif"),
  currentStock: z
    .number({ error: "Stok harus berupa angka" })
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .default(0),
  minStockWarning: z
    .number({ error: "Min. stok harus berupa angka" })
    .int("Min. stok harus bilangan bulat")
    .min(0, "Min. stok tidak boleh negatif")
    .default(5),
  supplierId: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ──────────────────────────────────────────────
// UPDATE PRODUCT
// ──────────────────────────────────────────────

export const updateProductSchema = z.object({
  id: z.string().min(1, "Product ID wajib"),
  name: z
    .string()
    .min(1, "Nama produk wajib diisi")
    .max(200, "Nama produk maksimal 200 karakter"),
  sku: z
    .string()
    .max(50, "SKU maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  barcode: z
    .string()
    .max(50, "Barcode maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  unitId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  buyPrice: z
    .number({ error: "Harga beli harus berupa angka" })
    .min(0, "Harga beli tidak boleh negatif"),
  sellPrice: z
    .number({ error: "Harga jual harus berupa angka" })
    .min(0, "Harga jual tidak boleh negatif"),
  minStockWarning: z
    .number({ error: "Min. stok harus berupa angka" })
    .int("Min. stok harus bilangan bulat")
    .min(0, "Min. stok tidak boleh negatif")
    .default(5),
  supplierId: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ──────────────────────────────────────────────
// PRODUCT FILTER / SEARCH
// ──────────────────────────────────────────────

export const productFilterSchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["name", "sellPrice", "currentStock", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

// ──────────────────────────────────────────────
// DELETE PRODUCT
// ──────────────────────────────────────────────

export const deleteProductSchema = z.object({
  id: z.string().min(1, "Product ID wajib"),
});

export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
