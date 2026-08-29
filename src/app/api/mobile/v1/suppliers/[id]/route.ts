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
    const { name, contactName, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama supplier wajib diisi" }, { status: 400 });
    }

    const existingSupplier = await db.supplier.findFirst({
      where: { id, storeId: auth.storeId }
    });

    if (!existingSupplier) {
      return NextResponse.json({ success: false, message: "Supplier tidak ditemukan" }, { status: 404 });
    }

    const updatedSupplier = await db.supplier.update({
      where: { id },
      data: {
        name,
        contactName: contactName || null,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Supplier berhasil diperbarui",
      data: updatedSupplier,
    });
  } catch (error) {
    console.error("[PUT /suppliers/[id]]", error);
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

    const existingSupplier = await db.supplier.findFirst({
      where: { id, storeId: auth.storeId },
      include: { _count: { select: { products: true } } }
    });

    if (!existingSupplier) {
      return NextResponse.json({ success: false, message: "Supplier tidak ditemukan" }, { status: 404 });
    }

    if (existingSupplier._count.products > 0) {
      return NextResponse.json({ success: false, message: "Supplier tidak dapat dihapus karena masih terhubung dengan produk" }, { status: 400 });
    }

    await db.supplier.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Supplier berhasil dihapus",
    });
  } catch (error) {
    console.error("[DELETE /suppliers/[id]]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
