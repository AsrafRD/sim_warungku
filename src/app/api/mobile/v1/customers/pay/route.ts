import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { customerId, amount, paymentType, notes } = body;

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Data pembayaran tidak valid" }, { status: 400 });
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.storeId !== auth.storeId) {
      return NextResponse.json({ success: false, message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    if (amount > Number(customer.debtBalance)) {
      return NextResponse.json({ success: false, message: "Nominal bayar melebihi sisa kasbon" }, { status: 400 });
    }

    const payment = await db.$transaction(async (tx) => {
      const debtPayment = await tx.debtPayment.create({
        data: {
          customerId,
          amount,
          paymentType: paymentType || "CASH",
          notes,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          debtBalance: { decrement: amount },
        },
      });

      return debtPayment;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...payment,
        amount: Number(payment.amount)
      },
      message: "Pembayaran kasbon berhasil dicatat",
    });
  } catch (error) {
    console.error("[POST /customers/pay]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
