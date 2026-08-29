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

    const whereClause: Prisma.UnitWhereInput = {
      storeId: auth.storeId,
      ...(search && {
        name: { contains: search, mode: "insensitive" }
      }),
    };

    const [units, total] = await Promise.all([
      db.unit.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      db.unit.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: units,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      }
    });
  } catch (error) {
    console.error("[GET /units]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama satuan wajib diisi" }, { status: 400 });
    }

    const unit = await db.unit.create({
      data: {
        storeId: auth.storeId,
        name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Satuan berhasil ditambahkan",
      data: unit,
    });
  } catch (error) {
    console.error("[POST /units]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
