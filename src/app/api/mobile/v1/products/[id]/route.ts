import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const {
      name,
      categoryId,
      unitId,
      sku,
      barcode,
      buyPrice,
      sellPrice,
      currentStock,
      minStockWarning,
      supplierId,
      image,
    } = body;

    if (!name || !categoryId || !unitId || buyPrice == null || sellPrice == null) {
      return NextResponse.json({ success: false, message: "Field wajib belum diisi" }, { status: 400 });
    }

    // Verify ownership
    const existingProduct = await db.product.findFirst({
      where: {
        id,
        storeId: auth.storeId
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: "Produk tidak ditemukan" }, { status: 404 });
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name,
        categoryId,
        unitId,
        sku: sku || undefined,
        barcode: barcode || undefined,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        currentStock: Number(currentStock || 0),
        minStockWarning: Number(minStockWarning || 0),
        supplierId: supplierId || undefined,
        imageUrl: image || undefined,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Produk berhasil diperbarui",
      data: {
        ...updatedProduct,
        buyPrice: Number(updatedProduct.buyPrice),
        sellPrice: Number(updatedProduct.sellPrice),
      },
    });

  } catch (error) {
    console.error("[PUT /products/[id]]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
