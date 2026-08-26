import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { formatRupiah } from "@/lib/format";
import { Receipt, Calendar, CreditCard } from "lucide-react";

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
        include: { product: { select: { name: true } } }
      }
    },
    take: 50 // recent 50 orders
  });

  const orders = rawOrders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    paidAmount: Number(order.paidAmount),
    changeAmount: Number(order.changeAmount),
    items: order.items.map(item => ({
      ...item,
      buyPrice: Number(item.buyPrice),
      sellPrice: Number(item.sellPrice),
      subtotal: Number(item.subtotal),
    }))
  }));

  return (
    <>
      <AdminHeader title="Riwayat Transaksi" />
      <div className="flex-1 p-4 pb-20 bg-slate-50 overflow-y-auto">
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              <Receipt className="size-12 mx-auto mb-3 opacity-20" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
