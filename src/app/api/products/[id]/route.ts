import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validations/product.schema";
import { validateStoreAccess } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    // Check ownership
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing || existing.storeId !== storeDbId) {
      return NextResponse.json({ success: false, message: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Check unique SKU
    if (data.sku && data.sku !== existing.sku) {
      const skuExist = await db.product.findFirst({
        where: { storeId: storeDbId, sku: data.sku, id: { not: id } },
      });
      if (skuExist) {
        return NextResponse.json({ success: false, message: "SKU sudah digunakan" }, { status: 400 });
      }
    }

    // Check unique barcode
    if (data.barcode && data.barcode !== existing.barcode) {
      const barcodeExist = await db.product.findFirst({
        where: { storeId: storeDbId, barcode: data.barcode, id: { not: id } },
      });
      if (barcodeExist) {
        return NextResponse.json({ success: false, message: "Barcode sudah digunakan" }, { status: 400 });
      }
    }

    // Handle Stock Update & Logging if stock is changed
    let newStock = existing.currentStock;
    let stockUpdated = false;

    if (data.currentStock !== undefined && data.currentStock !== existing.currentStock) {
      newStock = data.currentStock;
      stockUpdated = true;
    }

    const updated = await db.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode,
          categoryId: data.categoryId || null,
          unitId: data.unitId || null,
          supplierId: data.supplierId || null,
          imageUrl: data.imageUrl || null,
          buyPrice: data.buyPrice,
          sellPrice: data.sellPrice,
          minStockWarning: data.minStockWarning,
          currentStock: newStock,
        },
      });

      if (stockUpdated) {
        await tx.stockLog.create({
          data: {
            storeId: storeDbId,
            productId: id,
            type: newStock > existing.currentStock ? "IN" : "OPNAME_ADJUSTMENT",
            quantity: Math.abs(newStock - existing.currentStock),
            stockBefore: existing.currentStock,
            stockAfter: newStock,
            notes: "Restock / Penyesuaian Manual"
          }
        });
      }

      return prod;
    });

    return NextResponse.json({ success: true, message: "Produk berhasil diperbarui", data: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check ownership
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing || existing.storeId !== storeDbId) {
      return NextResponse.json({ success: false, message: "Produk tidak ditemukan" }, { status: 404 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Produk berhasil dihapus" });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
