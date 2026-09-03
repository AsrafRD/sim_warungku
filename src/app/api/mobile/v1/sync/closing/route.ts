import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";

interface SyncOrderItem {
  productId: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  subtotal: number;
}

interface SyncOrder {
  invoiceNo: string;
  customerId?: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentType: "CASH" | "QRIS" | "TRANSFER" | "KASBON";
  notes?: string;
  createdAt?: string;
  items: SyncOrderItem[];
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth || !auth.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Token tidak valid atau tidak memiliki akses toko." },
        { status: 401 }
      );
    }

    const { storeId } = auth;

    // 1. Verifikasi Lisensi Toko (Cloud Sync hanya diizinkan untuk lisensi berbayar aktif)
    const store = await db.store.findUnique({
      where: { id: storeId },
      include: { subscription: true },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Toko tidak ditemukan" },
        { status: 404 }
      );
    }

    const sub = store.subscription;
    const now = new Date();

    if (!sub || sub.status !== "ACTIVE" || (sub.currentPeriodEnd && sub.currentPeriodEnd < now)) {
      if (sub?.status === "TRIAL") {
        return NextResponse.json(
          {
            success: false,
            code: "TRIAL_SYNC_LOCKED",
            message:
              "Toko Anda berstatus Trial. Operasional kasir tetap aman berjalan 100% di penyimpanan lokal perangkat. Sinkronisasi data closingan & multi-cabang ke server cloud adalah fitur lisensi berbayar. Silakan aktifkan langganan melalui website resmi.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: "LICENSE_EXPIRED",
          message:
            "Masa aktif lisensi toko telah berakhir. Silakan perpanjang langganan melalui website resmi untuk melakukan sinkronisasi closingan.",
        },
        { status: 403 }
      );
    }

    // 2. Baca payload batch closing dari mobile client
    const body = await req.json();
    const {
      shiftId,
      closingBalance,
      expectedBalance,
      notes,
      orders = [],
    }: {
      shiftId?: string;
      closingBalance?: number;
      expectedBalance?: number;
      notes?: string;
      orders?: SyncOrder[];
    } = body;

    // 3. Eksekusi proses sinkronisasi secara atomic & idempotent
    let processedOrdersCount = 0;

    await db.$transaction(async (tx) => {
      // A. Ingest Transaksi Penjualan (Idempotent by invoiceNo)
      for (const order of orders) {
        if (!order.invoiceNo || !order.items || order.items.length === 0) continue;

        // Cek apakah invoiceNo sudah pernah tersimpan (mencegah duplikasi saat retry)
        const existingOrder = await tx.order.findUnique({
          where: { invoiceNo: order.invoiceNo },
        });

        if (existingOrder) {
          continue; // Lewati jika sudah ada
        }

        const createdOrder = await tx.order.create({
          data: {
            storeId,
            shiftId: shiftId || null,
            customerId: order.customerId || null,
            invoiceNo: order.invoiceNo,
            totalAmount: order.totalAmount,
            paidAmount: order.paidAmount,
            changeAmount: order.changeAmount || 0,
            paymentType: order.paymentType || "CASH",
            notes: order.notes,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            items: {
              create: order.items.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                buyPrice: it.buyPrice,
                sellPrice: it.sellPrice,
                subtotal: it.subtotal,
              })),
            },
          },
        });

        // Potong stok produk di server cloud & catat mutasi stok
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const updatedProduct = await tx.product.update({
              where: { id: item.productId },
              data: {
                currentStock: {
                  decrement: item.quantity,
                },
              },
            });

            await tx.stockLog.create({
              data: {
                storeId,
                productId: item.productId,
                type: "OUT_SALE",
                quantity: item.quantity,
                stockBefore: product.currentStock,
                stockAfter: updatedProduct.currentStock,
                referenceId: createdOrder.id,
                notes: `Penjualan Kasir Mobile EOD (${order.invoiceNo})`,
              },
            });
          }
        }

        processedOrdersCount++;
      }

      // B. Update / Tutup Shift Kasir jika ada shiftId
      if (shiftId) {
        const existingShift = await tx.shift.findUnique({
          where: { id: shiftId },
        });

        if (existingShift && existingShift.status === "OPEN") {
          await tx.shift.update({
            where: { id: shiftId },
            data: {
              status: "CLOSED",
              closingBalance: closingBalance ?? existingShift.closingBalance,
              expectedBalance: expectedBalance ?? existingShift.expectedBalance,
              notes: notes || existingShift.notes,
              closedAt: new Date(),
            },
          });
        }
      }
    });

    // 4. Ambil katalog produk terbaru sebagai delta untuk memperbarui cache lokal mobile
    const latestProducts = await db.product.findMany({
      where: { storeId },
      include: { unit: true, category: true },
    });

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi closingan berhasil. ${processedOrdersCount} transaksi baru dicatat ke cloud.`,
      data: {
        syncedOrdersCount: processedOrdersCount,
        closingCompletedAt: new Date().toISOString(),
        latestProducts,
      },
    });
  } catch (error: unknown) {
    console.error("[POST /api/mobile/v1/sync/closing Error]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat memproses sinkronisasi closingan",
      },
      { status: 500 }
    );
  }
}
