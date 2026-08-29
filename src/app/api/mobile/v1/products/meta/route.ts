import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [categories, units, suppliers] = await Promise.all([
      db.category.findMany({
        where: { storeId: auth.storeId },
        orderBy: { name: "asc" },
      }),
      db.unit.findMany({
        where: { storeId: auth.storeId },
        orderBy: { name: "asc" },
      }),
      db.supplier.findMany({
        where: { storeId: auth.storeId },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categories,
        units,
        suppliers,
      }
    });

  } catch (error) {
    console.error("[GET /products/meta]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
