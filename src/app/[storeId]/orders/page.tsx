import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { Receipt, ShoppingBag } from "lucide-react";

import { OrderCard } from "@/components/modules/order/order-card";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

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
    take: 50,
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
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8DFB5] bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#F5F5DC] text-[#C8B96B]">
                <ShoppingBag className="size-7" />
              </div>

              <h3 className="font-bold text-slate-800">
                Belum ada transaksi
              </h3>

              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                Transaksi yang berhasil dilakukan akan muncul di halaman ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order as any}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}