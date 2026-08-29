import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const existingCategory = await db.category.findFirst({
      where: { id, storeId: auth.storeId }
    });

    if (!existingCategory) {
      return NextResponse.json({ success: false, message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const updatedCategory = await db.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil diperbarui",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("[PUT /categories/[id]]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existingCategory = await db.category.findFirst({
      where: { id, storeId: auth.storeId },
      include: { _count: { select: { products: true } } }
    });

    if (!existingCategory) {
      return NextResponse.json({ success: false, message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (existingCategory._count.products > 0) {
      return NextResponse.json({ success: false, message: "Kategori tidak dapat dihapus karena masih digunakan oleh produk" }, { status: 400 });
    }

    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.error("[DELETE /categories/[id]]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
