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

    const whereClause: Prisma.OrderWhereInput = {
      storeId: auth.storeId,
      ...(search && {
        OR: [
          { invoiceNo: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [rawOrders, total] = await Promise.all([
      db.order.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, name: true } },
          shift: { select: { id: true, cashierId: true, openedAt: true } },
          items: {
            include: {
              product: { select: { name: true, unit: { select: { name: true } } } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where: whereClause }),
    ]);

    const orders = rawOrders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      paidAmount: Number(o.paidAmount),
      changeAmount: Number(o.changeAmount),
      items: o.items.map(item => ({
        ...item,
        buyPrice: Number(item.buyPrice),
        sellPrice: Number(item.sellPrice),
        subtotal: Number(item.subtotal),
      }))
    }));

    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      }
    });
  } catch (error) {
    console.error("[GET /orders]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
