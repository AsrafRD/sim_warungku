import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const [
      todayOrders,
      monthOrders,
      lowStockProducts,
      last7DaysOrders,
      last7DaysItems,
      monthItems,
      topItemsGroup,
    ] = await Promise.all([
      db.order.findMany({
        where: { storeId: auth.storeId, createdAt: { gte: startOfDay } },
        select: { totalAmount: true },
      }),
      db.order.findMany({
        where: { storeId: auth.storeId, createdAt: { gte: startOfMonth } },
        select: { totalAmount: true },
      }),
      db.product.findMany({
        where: {
          storeId: auth.storeId,
          currentStock: { lte: db.product.fields.minStockWarning },
        },
        take: 10,
        orderBy: { currentStock: "asc" },
        select: { id: true, name: true, currentStock: true, minStockWarning: true }
      }),
      db.order.findMany({
        where: { storeId: auth.storeId, createdAt: { gte: sevenDaysAgo } },
        select: { totalAmount: true, createdAt: true },
      }),
      db.orderItem.findMany({
        where: {
          order: { storeId: auth.storeId, createdAt: { gte: sevenDaysAgo } }
        },
        select: {
          quantity: true,
          sellPrice: true,
          buyPrice: true,
          order: { select: { createdAt: true } }
        }
      }),
      db.orderItem.findMany({
        where: {
          order: { storeId: auth.storeId, createdAt: { gte: startOfMonth } }
        },
        select: {
          quantity: true,
          sellPrice: true,
          buyPrice: true,
        }
      }),
      db.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
          subtotal: true,
        },
        where: {
          order: {
            storeId: auth.storeId,
          },
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),
    ]);

    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const monthProfit = monthItems.reduce((sum, item) => sum + ((Number(item.sellPrice) - Number(item.buyPrice)) * item.quantity), 0);

    // Ambil detail produk untuk topProducts
    const topProductsIds = topItemsGroup.map(item => item.productId);
    const topProductsDetails = await db.product.findMany({
      where: { id: { in: topProductsIds } },
      select: { id: true, name: true, sku: true, currentStock: true }
    });

    const topProducts = topItemsGroup.map(item => {
      const detail = topProductsDetails.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: detail?.name ?? "Produk Tidak Diketahui",
        soldQuantity: item._sum.quantity ?? 0,
        subtotal: item._sum.subtotal ?? 0,
      };
    });

    // Chart Data (Last 7 Days)
    const chartMap = new Map<string, { revenue: number; profit: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate() + i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      chartMap.set(dateStr, { revenue: 0, profit: 0 });
    }

    last7DaysOrders.forEach((order) => {
      const dateStr = order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (chartMap.has(dateStr)) {
        const data = chartMap.get(dateStr)!;
        chartMap.set(dateStr, { ...data, revenue: data.revenue + Number(order.totalAmount) });
      }
    });

    last7DaysItems.forEach((item) => {
      const dateStr = item.order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (chartMap.has(dateStr)) {
        const data = chartMap.get(dateStr)!;
        const profit = (Number(item.sellPrice) - Number(item.buyPrice)) * item.quantity;
        chartMap.set(dateStr, { ...data, profit: data.profit + profit });
      }
    });

    const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({ date, ...data }));

    return NextResponse.json({
      success: true,
      data: {
        todayRevenue,
        todayTransactions: todayOrders.length,
        monthRevenue,
        monthProfit,
        monthTransactions: monthOrders.length,
        lowStockProducts,
        chartData,
        topProducts
      }
    });
  } catch (error) {
    console.error("[GET /dashboard]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
