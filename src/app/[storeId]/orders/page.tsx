import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { Receipt, ShoppingBag } from "lucide-react";

import { OrderListClient } from "./order-list-client";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  const sub = await db.subscription.findUnique({
    where: { storeId: storeDbId },
  });
  if (!sub?.hasWebAccess) {
    redirect(`/${storeId}`);
  }

  const rawOrders = await db.order.findMany({
    where: { storeId: storeDbId },
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
    take: 20,
  });
  
  const totalOrders = await db.order.count({
    where: { storeId: storeDbId }
  });

  const orders = rawOrders.map((order) => ({
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

  return (
    <div className="min-h-full bg-[#F5F5DC]/40">
      <AdminHeader title="Riwayat Transaksi" />

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">

          {/* Page Intro */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF8F00]">
                Transaksi
              </p>

              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Riwayat Transaksi
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Menampilkan 50 transaksi terbaru
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-[#FFF0D6] text-[#FF8F00]">
              <Receipt className="size-5" />
            </div>
          </div>

          {/* Orders */}
          <OrderListClient 
            storeId={storeId} 
            initialOrders={orders}
            initialHasMore={orders.length < totalOrders}
          />

        </div>
      </main>
    </div>
  );
}