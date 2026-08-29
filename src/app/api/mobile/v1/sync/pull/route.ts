import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { storeId } = auth;
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Toko tidak valid" },
        { status: 400 }
      );
    }

    // Fetch all master data for the given store
    const [
      products,
      categories,
      units,
      suppliers,
      customers
    ] = await Promise.all([
      db.product.findMany({
        where: { storeId },
        include: { unit: true, category: true, supplier: true }
      }),
      db.category.findMany({ where: { storeId } }),
      db.unit.findMany({ where: { storeId } }),
      db.supplier.findMany({ where: { storeId } }),
      db.customer.findMany({ where: { storeId } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Data master berhasil ditarik",
      data: {
        products,
        categories,
        units,
        suppliers,
        customers,
      }
    });
  } catch (error: any) {
    console.error("Pull Sync API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat menarik data sinkronisasi" },
      { status: 500 }
    );
  }
}
