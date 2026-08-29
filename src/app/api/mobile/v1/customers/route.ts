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

    const whereClause: Prisma.CustomerWhereInput = {
      storeId: auth.storeId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [rawCustomers, total, totalPiutangResult] = await Promise.all([
      db.customer.findMany({
        where: whereClause,
        include: {
          debtPayments: {
            orderBy: { createdAt: "desc" },
            take: 5,
          }
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      db.customer.count({ where: whereClause }),
      db.customer.aggregate({
        where: { storeId: auth.storeId },
        _sum: { debtBalance: true },
      }),
    ]);

    const totalPiutang = Number(totalPiutangResult._sum.debtBalance || 0);

    const customers = rawCustomers.map((c) => ({
      ...c,
      debtBalance: Number(c.debtBalance),
      debtPayments: c.debtPayments.map(dp => ({
        ...dp,
        amount: Number(dp.amount)
      }))
    }));

    return NextResponse.json({
      success: true,
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
        totalPiutang,
      }
    });
  } catch (error) {
    console.error("[GET /customers]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama pelanggan wajib diisi" }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        storeId: auth.storeId,
        name,
        phone,
        address,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        debtBalance: Number(customer.debtBalance)
      }
    });
  } catch (error) {
    console.error("[POST /customers]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
