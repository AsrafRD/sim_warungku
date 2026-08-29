import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const shift = await db.shift.findFirst({
      where: {
        storeId: auth.storeId,
        cashierId: auth.userId,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, data: shift });
  } catch (error) {
    console.error("[GET /shifts]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { openingBalance } = body;

    if (openingBalance === undefined) {
      return NextResponse.json({ success: false, message: "openingBalance is required" }, { status: 400 });
    }

    const existing = await db.shift.findFirst({
      where: {
        storeId: auth.storeId,
        cashierId: auth.userId,
        status: "OPEN",
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Anda sudah memiliki shift yang aktif." }, { status: 400 });
    }

    const newShift = await db.shift.create({
      data: {
        storeId: auth.storeId,
        cashierId: auth.userId,
        openingBalance,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, data: newShift });
  } catch (error) {
    console.error("[POST /shifts]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { shiftId, closingBalance, notes } = body;

    if (!shiftId || closingBalance === undefined) {
      return NextResponse.json({ success: false, message: "shiftId and closingBalance are required" }, { status: 400 });
    }

    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      include: {
        orders: true,
      },
    });

    if (!shift || shift.cashierId !== auth.userId || shift.status === "CLOSED") {
      return NextResponse.json({ success: false, message: "Shift tidak ditemukan atau sudah ditutup." }, { status: 404 });
    }

    const cashOrdersTotal = shift.orders
      .filter((o) => o.paymentType === "CASH")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const expectedBalance = Number(shift.openingBalance) + cashOrdersTotal;

    const closedShift = await db.shift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        closingBalance,
        expectedBalance,
        notes,
        closedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: closedShift });
  } catch (error) {
    console.error("[PUT /shifts]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
