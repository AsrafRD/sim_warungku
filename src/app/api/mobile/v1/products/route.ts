import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {
      storeId: auth.storeId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [rawProducts, total] = await Promise.all([
      db.product.findMany({
        where: whereClause,
        include: {
          unit: {
            select: { name: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      db.product.count({ where: whereClause }),
    ]);

    const products = rawProducts.map((p) => ({
      ...p,
      buyPrice: Number(p.buyPrice),
      sellPrice: Number(p.sellPrice),
    }));

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      }
    });
  } catch (error) {
    console.error("[GET /products]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

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

    const product = await db.product.create({
      data: {
        storeId: auth.storeId,
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
      message: "Produk berhasil ditambahkan",
      data: {
        ...product,
        buyPrice: Number(product.buyPrice),
        sellPrice: Number(product.sellPrice),
      },
    });

  } catch (error) {
    console.error("[POST /products]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
