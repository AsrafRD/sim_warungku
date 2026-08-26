import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { formatRupiah } from "@/lib/format";
import { Receipt, Calendar, CreditCard } from "lucide-react";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  const orders = await db.order.findMany({
    where: { storeId: storeDbId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    },
    take: 50 // recent 50 orders
  });

  return (
    <>
      <AdminHeader title="Riwayat Transaksi" />
      <div className="flex-1 p-4 pb-20 bg-slate-50 overflow-y-auto">
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              <Receipt className="size-12 mx-auto mb-3 opacity-20" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Receipt className="size-4 text-indigo-500" />
                      {order.invoiceNo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {order.createdAt.toLocaleString("id-ID", { 
                        dateStyle: "medium", 
                        timeStyle: "short" 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                      <CreditCard className="size-3" />
                      {order.paymentType}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600 line-clamp-1 flex-1 pr-2">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-slate-900 font-medium whitespace-nowrap">
                        {formatRupiah(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                  <span className="font-medium text-slate-500 text-sm">Total Belanja</span>
                  <span className="font-extrabold text-indigo-600 text-lg">
                    {formatRupiah(Number(order.totalAmount))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
