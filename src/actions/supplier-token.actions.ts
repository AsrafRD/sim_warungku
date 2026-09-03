"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";
import type { ActionResponse } from "@/lib/types/action-response";

const TOKEN_PRICE = 29000; // Rp 29.000 per token (+10 slot toko)

const purchaseTokenSchema = z.object({
  tokens: z.number().min(1).max(10).default(1),
});

export async function createSupplierTokenPaymentAction(
  input: z.infer<typeof purchaseTokenSchema>
): Promise<ActionResponse<{ token: string; orderId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPPLIER") {
      return { success: false, message: "Hanya akun Supplier yang dapat membeli token kuota" };
    }

    const parsed = purchaseTokenSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: "Jumlah token tidak valid" };
    }

    const { tokens } = parsed.data;
    const totalAmount = tokens * TOKEN_PRICE;
    const storesAdded = tokens * 10;
    const orderId = `SUPP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1. Simpan record transaksi token pending di DB
    await db.supplierTokenTransaction.create({
      data: {
        userId: session.user.id,
        tokensPurchased: tokens,
        storesAdded,
        amount: totalAmount,
        midtransOrderId: orderId,
        status: "PENDING",
      },
    });

    // 2. Buat transaksi Snap Midtrans
    const snapResult = await createSnapTransaction({
      orderId,
      grossAmount: totalAmount,
      customerName: session.user.name || "Supplier",
      customerEmail: session.user.email || "supplier@warung.com",
      items: [
        {
          id: `TOKEN-${tokens}`,
          price: totalAmount,
          quantity: 1,
          name: `Token Kuota Toko Supplier (+${storesAdded} Toko)`,
        },
      ],
    });

    return {
      success: true,
      message: "Token transaksi pembayaran berhasil dibuat",
      data: {
        token: snapResult.token,
        orderId,
      },
    };
  } catch (error) {
    console.error("[createSupplierTokenPaymentAction]", error);
    const err = error as Error;
    return {
      success: false,
      message: err.message || "Gagal membuat transaksi token",
    };
  }
}
