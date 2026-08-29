import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const skip = (page - 1) * limit;

    const whereClause: Prisma.SupplierWhereInput = {
      storeId: auth.storeId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { contactName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ]
      }),
    };

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      db.supplier.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      }
    });
  } catch (error) {
    console.error("[GET /suppliers]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, contactName, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama supplier wajib diisi" }, { status: 400 });
    }

    const supplier = await db.supplier.create({
      data: {
        storeId: auth.storeId,
        name,
        contactName: contactName || null,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Supplier berhasil ditambahkan",
      data: supplier,
    });
  } catch (error) {
    console.error("[POST /suppliers]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
