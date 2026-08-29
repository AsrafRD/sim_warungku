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
      return NextResponse.json({ success: false, message: "Nama satuan wajib diisi" }, { status: 400 });
    }

    const existingUnit = await db.unit.findFirst({
      where: { id, storeId: auth.storeId }
    });

    if (!existingUnit) {
      return NextResponse.json({ success: false, message: "Satuan tidak ditemukan" }, { status: 404 });
    }

    const updatedUnit = await db.unit.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({
      success: true,
      message: "Satuan berhasil diperbarui",
      data: updatedUnit,
    });
  } catch (error) {
    console.error("[PUT /units/[id]]", error);
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

    const existingUnit = await db.unit.findFirst({
      where: { id, storeId: auth.storeId },
      include: { _count: { select: { products: true } } }
    });

    if (!existingUnit) {
      return NextResponse.json({ success: false, message: "Satuan tidak ditemukan" }, { status: 404 });
    }

    if (existingUnit._count.products > 0) {
      return NextResponse.json({ success: false, message: "Satuan tidak dapat dihapus karena masih digunakan oleh produk" }, { status: 400 });
    }

    await db.unit.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Satuan berhasil dihapus",
    });
  } catch (error) {
    console.error("[DELETE /units/[id]]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
