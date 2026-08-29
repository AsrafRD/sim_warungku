import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      buyPrice: z.number(),
      sellPrice: z.number(),
    })
  ).min(1, "Keranjang tidak boleh kosong"),
  paymentType: z.enum(["CASH", "QRIS", "TRANSFER", "KASBON"]).default("CASH"),
  paidAmount: z.number().min(0),
  shiftId: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "Data transaksi tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { items, paymentType, paidAmount, shiftId, customerId, notes } = parsed.data;

    const totalAmount = items.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
    const changeAmount = paidAmount >= totalAmount ? paidAmount - totalAmount : 0;

    if (paymentType !== "KASBON" && paidAmount < totalAmount) {
      return NextResponse.json({ success: false, message: "Uang pembayaran kurang" }, { status: 400 });
    }

    if (paymentType === "KASBON" && !customerId) {
      return NextResponse.json({ success: false, message: "Pelanggan wajib diisi untuk transaksi KASBON" }, { status: 400 });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNo = `INV-${dateStr}-${randomStr}`;

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          storeId: auth.storeId,
          shiftId: shiftId || null,
          customerId: customerId || null,
          invoiceNo,
          totalAmount,
          paidAmount,
          changeAmount,
          paymentType,
          notes,
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

      if (customerId) {
        const debtIncrease = totalAmount - paidAmount;
        if (debtIncrease > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { debtBalance: { increment: debtIncrease } }
          });
        }
      }

      for (const item of items) {
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
            storeId: auth.storeId,
            productId: item.productId,
            type: "OUT_SALE",
            quantity: item.quantity,
            stockBefore: product.currentStock,
            stockAfter: updatedProduct.currentStock,
            referenceId: newOrder.id,
            notes: `Penjualan kasir via Mobile (${invoiceNo})`,
          }
        });
      }

      return newOrder;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Transaksi berhasil diproses",
      data: { invoiceNo: order.invoiceNo }
    });
  } catch (error) {
    console.error("[POST /pos/checkout]", error);
    const err = error as Error;
    return NextResponse.json({ 
      success: false, 
      message: err?.message || "Gagal memproses transaksi" 
    }, { status: 500 });
  }
}
