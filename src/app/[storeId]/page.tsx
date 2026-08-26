import { AdminHeader } from "@/components/modules/admin/admin-header";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import { AlertCircle, TrendingUp, Package, ShoppingBag, BarChart3, Trophy, Activity } from "lucide-react";
import { DashboardChart } from "@/components/modules/admin/dashboard-chart";

interface DashboardPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  // Date ranges
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  // Fetch Dashboard Stats
  const [todayOrders, monthOrders, lowStockProducts, topItemsGroup, last7DaysOrders] = await Promise.all([
    db.order.findMany({
      where: { storeId: storeDbId, createdAt: { gte: startOfDay } },
      select: { totalAmount: true }
    }),
    db.order.findMany({
      where: { storeId: storeDbId, createdAt: { gte: startOfMonth } },
      select: { totalAmount: true }
    }),
    db.product.findMany({
      where: { 
        storeId: storeDbId,
        currentStock: { lte: db.product.fields.minStockWarning }
      },
      take: 5,
      orderBy: { currentStock: 'asc' }
    }),
    db.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      where: { order: { storeId: storeDbId } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    }),
    db.order.findMany({
      where: { storeId: storeDbId, createdAt: { gte: sevenDaysAgo } },
      select: { totalAmount: true, createdAt: true }
    })
  ]);

  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  // Fetch names for top items
  const topProductIds = topItemsGroup.map(t => t.productId);
  const topProductsData = await db.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, unit: true }
  });
  
  const topProducts: { id: string; name: string; unit: string; quantity: number; revenue: number }[] = topItemsGroup.map(item => {
    const p = topProductsData.find(prod => prod.id === item.productId);
    
    // Type-safe extraction of unit name
    let unitStr = "PCS";
    if (p?.unit) {
      if (typeof p.unit === "object" && "name" in p.unit) {
        unitStr = p.unit.name as string;
      } else if (typeof p.unit === "string") {
        unitStr = p.unit;
      }
    }

    return {
      id: item.productId,
      name: p?.name || "Produk dihapus",
      unit: unitStr,
      quantity: item._sum.quantity || 0,
      revenue: Number(item._sum.subtotal || 0)
    };
  });

  // Prepare Chart Data
  const chartMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate() + i);
    const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    chartMap.set(dateStr, 0);
  }

  last7DaysOrders.forEach(order => {
    const dateStr = order.createdAt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    if (chartMap.has(dateStr)) {
      chartMap.set(dateStr, chartMap.get(dateStr)! + Number(order.totalAmount));
    }
  });

  const chartData = Array.from(chartMap.entries()).map(([date, revenue]) => ({
    date,
    revenue
  }));

  return (
    <>
      {/* <AdminHeader title="Warung Dashboard" /> */}

      <div className="flex-1 p-4 space-y-4 pb-24 bg-slate-50 overflow-y-auto">
        
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
              <p className="text-2xl font-extrabold text-slate-800">{todayOrders.length}</p>
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

        {/* Weekly Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
              <Activity className="size-4" />
            </div>
            <h3 className="font-bold text-slate-800">Omset 7 Hari Terakhir</h3>
          </div>
          <DashboardChart data={chartData} />
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
              <BarChart3 className="size-4" />
            </div>
            <h3 className="font-bold text-slate-800">Performa Bulan Ini</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Omset</p>
              <p className="font-black text-slate-800 text-lg">{formatRupiah(monthRevenue)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Transaksi</p>
              <p className="font-black text-slate-800 text-lg">{monthOrders.length} struk</p>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
              <Trophy className="size-4" />
            </div>
            <h3 className="font-bold text-slate-800">5 Produk Terlaris</h3>
          </div>
          <div className="space-y-1">
            {topProducts.length === 0 ? (
               <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada data penjualan bulan ini.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center font-black text-sm size-6 rounded-full shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-700 text-sm line-clamp-1 leading-tight mb-0.5">{p.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{p.quantity} {p.unit} terjual</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-emerald-600 text-sm">{formatRupiah(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
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
                    <p className="text-[10px] text-slate-500 font-medium">Min. peringatan: {product.minStockWarning}</p>
                  </div>
                  <div className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-lg text-xs shrink-0">
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
