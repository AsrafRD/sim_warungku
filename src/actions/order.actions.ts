"use server";

import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { auth } from "@/auth";

export async function getOrdersPaginated(storeId: string, page: number = 1, limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Store access denied" };
    }

    const skip = (page - 1) * limit;

    const where = { storeId: storeDbId };

    const [total, rawOrders] = await db.$transaction([
      db.order.count({ where }),
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        skip,
      })
    ]);

    const parsedOrders = rawOrders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      paidAmount: Number(order.paidAmount),
      changeAmount: Number(order.changeAmount),
      items: order.items.map((item) => ({
        ...item,
        buyPrice: Number(item.buyPrice),
        sellPrice: Number(item.sellPrice),
        subtotal: Number(item.subtotal),
      })),
    }));

    const hasMore = skip + rawOrders.length < total;

    return { 
      success: true, 
      data: parsedOrders,
      meta: {
        total,
        page,
        limit,
        hasMore
      }
    };
  } catch (error: any) {
    console.error("[getOrdersPaginated]", error);
    return { success: false, message: error.message || "Internal server error" };
  }
}
