import { NextResponse } from "next/server";
import { auth } from "@/auth";
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

    const updated = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        unitId: data.unitId || null,
        categoryId: data.categoryId || null,
        supplierId: data.supplierId || null,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        minStockWarning: data.minStockWarning,
      },
    });

    return NextResponse.json({ success: true, message: "Produk berhasil diperbarui", data: updated });
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
