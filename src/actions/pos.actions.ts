"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types/action-response";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      buyPrice: z.number(),
      sellPrice: z.number(),
    })
  ).min(1, "Keranjang tidak boleh kosong"),
  paymentType: z.enum(["CASH", "QRIS", "TRANSFER"]).default("CASH"),
  paidAmount: z.number().min(0),
});

export async function createOrder(
  storeId: string, // storeSlug
  input: z.infer<typeof checkoutSchema>
): Promise<ActionResponse<{ invoiceNo: string }>> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ke toko ditolak" };
    }

    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data transaksi tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { items, paymentType, paidAmount } = parsed.data;

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
    const changeAmount = paidAmount >= totalAmount ? paidAmount - totalAmount : 0;

    if (paidAmount < totalAmount) {
      return { success: false, message: "Uang pembayaran kurang" };
    }

    // Generate Invoice No (e.g. INV-20231015-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNo = `INV-${dateStr}-${randomStr}`;

    const order = await db.$transaction(async (tx) => {
      // 1. Create the Order
      const newOrder = await tx.order.create({
        data: {
          storeId: storeDbId,
          invoiceNo,
          totalAmount,
          paidAmount,
          changeAmount,
          paymentType,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              buyPrice: item.buyPrice,
              sellPrice: item.sellPrice,
              subtotal: item.sellPrice * item.quantity,
            }))
          }
        }
      });

      // 2. Decrement stock and create stock logs
      for (const item of items) {
        // Fetch current product to get stockBefore
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        if (product.currentStock < item.quantity) {
          throw new Error(`Stok produk "${product.name}" tidak mencukupi (Sisa: ${product.currentStock})`);
        }

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } }
        });

        await tx.stockLog.create({
          data: {
            storeId: storeDbId,
            productId: item.productId,
            type: "OUT_SALE",
            quantity: item.quantity,
            stockBefore: product.currentStock,
            stockAfter: updatedProduct.currentStock,
            referenceId: newOrder.id,
            notes: `Penjualan kasir (${invoiceNo})`,
          }
        });
      }

      return newOrder;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return { 
      success: true, 
      message: "Transaksi berhasil diproses",
      data: { invoiceNo: order.invoiceNo }
    };
  } catch (error) {
    console.error("[createOrder]", error);
    const err = error as Error;
    return { 
      success: false, 
      message: err?.message || "Gagal memproses transaksi" 
    };
  }
}
