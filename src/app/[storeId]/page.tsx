import { AdminHeader } from "@/components/modules/admin/admin-header";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import { AlertCircle, TrendingUp, Package, ShoppingBag } from "lucide-react";

interface DashboardPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  // Get Today's date range
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch Dashboard Stats
  const [todayOrders, totalProducts, lowStockProducts] = await Promise.all([
    db.order.findMany({
      where: { 
        storeId: storeDbId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      select: { totalAmount: true }
    }),
    db.product.count({ where: { storeId: storeDbId } }),
    db.product.findMany({
      where: { 
        storeId: storeDbId,
        currentStock: { lte: db.product.fields.minStockWarning }
      },
      take: 5,
      orderBy: { currentStock: 'asc' }
    })
  ]);

  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const orderCount = todayOrders.length;

  return (
    <>
      <AdminHeader title="Warung Dashboard" />

      <div className="flex-1 p-4 space-y-4 pb-20">
        
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white shadow-lg shadow-indigo-200">
          <h2 className="text-xl font-bold tracking-tight">Ringkasan Hari Ini</h2>
          <p className="text-indigo-100 text-sm mt-1">Pantau performa warung Anda secara real-time.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <ShoppingBag className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Transaksi</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{orderCount}</p>
              <p className="text-[10px] text-slate-400 font-medium">Hari ini</p>
            </div>
          </div>
          
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <TrendingUp className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Omset</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-indigo-600 line-clamp-1">
                {formatRupiah(todayRevenue)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Hari ini</p>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 mt-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
              <AlertCircle className="size-4" />
            </div>
            <h3 className="font-bold text-slate-800">Peringatan Stok Tipis</h3>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Package className="size-8 mx-auto mb-2 opacity-20" />
              Semua stok produk aman!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-slate-500">Min. peringatan: {product.minStockWarning}</p>
                  </div>
                  <div className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-lg text-sm shrink-0">
                    Sisa {product.currentStock}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
