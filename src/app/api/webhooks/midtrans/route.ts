import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { success: false, message: "Payload tidak lengkap" },
        { status: 400 }
      );
    }

    // 1. Verifikasi Signature Hash SHA-512
    const isValid = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      console.warn("[Midtrans Webhook] Invalid signature key for order:", order_id);
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 403 }
      );
    }

    // 2. Evaluasi status transaksi
    let isSuccess = false;
    if (transaction_status === "capture") {
      isSuccess = fraud_status === "accept";
    } else if (transaction_status === "settlement") {
      isSuccess = true;
    }

    // 3. Tangani order Supplier Token (SUPP-...)
    if (order_id.startsWith("SUPP-")) {
      const tokenTx = await db.supplierTokenTransaction.findUnique({
        where: { midtransOrderId: order_id },
      });

      if (tokenTx) {
        if (isSuccess && tokenTx.status !== "SETTLEMENT") {
          await db.$transaction([
            db.supplierTokenTransaction.update({
              where: { id: tokenTx.id },
              data: { status: "SETTLEMENT" },
            }),
            db.user.update({
              where: { id: tokenTx.userId },
              data: {
                supplierStoreQuota: {
                  increment: tokenTx.storesAdded,
                },
              },
            }),
          ]);
        } else if (["expire", "cancel", "deny"].includes(transaction_status)) {
          await db.supplierTokenTransaction.update({
            where: { id: tokenTx.id },
            data: { status: "FAILED" },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Webhook supplier diproses" });
    }

    // 4. Tangani order Toko / Langganan (STORE-... atau RENEW-...)
    if (order_id.startsWith("STORE-") || order_id.startsWith("RENEW-")) {
      const sub = await db.subscription.findFirst({
        where: { midtransOrderId: order_id },
      });

      if (sub) {
        if (isSuccess && sub.status !== "ACTIVE") {
          const now = new Date();
          const baseDate = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? new Date(sub.currentPeriodEnd) : now;
          const periodEnd = new Date(baseDate);

          if (sub.plan.includes("MONTHLY")) {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          }

          const hasWebAccess = sub.plan === "COMBO_MONTHLY" || sub.plan === "COMBO_YEARLY";

          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              hasWebAccess,
              midtransPaymentType: payment_type,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        } else if (["expire", "cancel", "deny"].includes(transaction_status)) {
          await db.subscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED" },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Webhook langganan toko diproses" });
    }

    return NextResponse.json({ success: true, message: "Webhook diterima" });
  } catch (error) {
    console.error("[Midtrans Webhook Error]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
