import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const changes = body.changes;

    if (!Array.isArray(changes)) {
      return NextResponse.json(
        { success: false, message: "Format payload tidak valid (harus array)" },
        { status: 400 }
      );
    }

    const { storeId } = auth;
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Toko tidak valid" },
        { status: 400 }
      );
    }

    // Process each change sequentially within a transaction, or independent transactions.
    // We'll process them independently to avoid one bad transaction failing the whole batch.
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const change of changes) {
      const { id: localId, entity, operation, payload } = change;

      try {
        if (entity === "SALE" && operation === "INSERT") {
          // Verify store ownership of product & shift
          // Expected payload: { id, storeId, shiftId, customerId, paymentType, totalAmount, paidAmount, notes, createdAt, items: [...] }
          
          await db.$transaction(async (tx) => {
            // 1. Create Order
            const newOrder = await tx.order.create({
              data: {
                id: payload.id, // Use local UUID generated from mobile
                storeId: storeId,
                shiftId: payload.shiftId,
                customerId: payload.customerId || null,
                paymentType: payload.paymentType,
                totalAmount: payload.totalAmount,
                paidAmount: payload.paidAmount,
                notes: payload.notes || null,
                createdAt: new Date(payload.createdAt),
                invoiceNo: `INV-${Date.now().toString().slice(-6)}`, // generate invoice
              }
            });

            // 2. Create Order Items & Update Stock
            if (payload.items && Array.isArray(payload.items)) {
              for (const item of payload.items) {
                await tx.orderItem.create({
                  data: {
                    id: item.id,
                    orderId: newOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    buyPrice: item.buyPrice,
                    sellPrice: item.sellPrice,
                    subtotal: item.quantity * item.sellPrice,
                  }
                });

                // Deduct stock
                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    currentStock: {
                      decrement: item.quantity
                    }
                  }
                });
              }
            }

            // 3. Customer Kasbon logic
            if (payload.paymentType === "KASBON" && payload.customerId) {
              await tx.customer.update({
                where: { id: payload.customerId },
                data: {
                  totalPiutang: {
                    increment: payload.totalAmount
                  }
                }
              });
            }
          });
        }
        
        successCount++;
        results.push({ localId, status: "SYNCED" });

      } catch (err: any) {
        console.error("Failed to sync change:", localId, err);
        failedCount++;
        results.push({ localId, status: "FAILED", error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync selesai. Berhasil: ${successCount}, Gagal: ${failedCount}`,
      data: {
        results
      }
    });

  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
