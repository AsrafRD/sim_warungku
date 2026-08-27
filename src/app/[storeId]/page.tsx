import { AdminHeader } from "@/components/modules/admin/admin-header";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import {
  AlertCircle,
  TrendingUp,
  Package,
  ShoppingBag,
  BarChart3,
  Trophy,
  Activity,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { DashboardChart } from "@/components/modules/admin/dashboard-chart";
import Link from "next/link";
import { auth } from "@/auth";

interface DashboardPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function DashboardPage({
  params,
}: DashboardPageProps) {
  const { storeId } = await params;

  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Date ranges
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const sevenDaysAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 6
  );

  // Fetch Dashboard Stats
  const [
    todayOrders,
    monthOrders,
    lowStockProducts,
    topItemsGroup,
    last7DaysOrders,
    last7DaysItems,
    monthItems,
    activeShift,
    lastClosedShift,
  ] = await Promise.all([
    db.order.findMany({
      where: {
        storeId: storeDbId,
        createdAt: { gte: startOfDay },
      },
      select: { totalAmount: true },
    }),

    db.order.findMany({
      where: {
        storeId: storeDbId,
        createdAt: { gte: startOfMonth },
      },
      select: { totalAmount: true },
    }),

    db.product.findMany({
      where: {
        storeId: storeDbId,
        currentStock: {
          lte: db.product.fields.minStockWarning,
        },
      },
      take: 5,
      orderBy: {
        currentStock: "asc",
      },
    }),

    db.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      where: {
        order: {
          storeId: storeDbId,
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),

    db.order.findMany({
      where: {
        storeId: storeDbId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    }),

    db.orderItem.findMany({
      where: {
        order: {
          storeId: storeDbId,
          createdAt: { gte: sevenDaysAgo },
        }
      },
      select: {
        quantity: true,
        sellPrice: true,
        buyPrice: true,
        order: {
          select: {
            createdAt: true,
          }
        }
      }
    }),

    db.orderItem.findMany({
      where: {
        order: {
          storeId: storeDbId,
          createdAt: { gte: startOfMonth },
        }
      },
      select: {
        quantity: true,
        sellPrice: true,
        buyPrice: true,
      }
    }),

    db.shift.findFirst({
      where: {
        storeId: storeDbId,
        cashierId: session.user.id,
        status: "OPEN",
      },
    }).then(s => s ? { ...s, openingBalance: Number(s.openingBalance), closingBalance: s.closingBalance ? Number(s.closingBalance) : null, expectedBalance: s.expectedBalance ? Number(s.expectedBalance) : null } : null),

    db.shift.findFirst({
      where: {
        storeId: storeDbId,
        status: "CLOSED",
      },
      orderBy: { closedAt: "desc" },
    }).then(s => s ? { ...s, openingBalance: Number(s.openingBalance), closingBalance: s.closingBalance ? Number(s.closingBalance) : null, expectedBalance: s.expectedBalance ? Number(s.expectedBalance) : null } : null),
  ]);

  const monthRevenue = monthOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );

  const monthProfit = monthItems.reduce(
    (sum, item) => sum + ((Number(item.sellPrice) - Number(item.buyPrice)) * item.quantity),
    0
  );

  // Fetch names for top items
  const topProductIds = topItemsGroup.map((t) => t.productId);

  const topProductsData = await db.product.findMany({
    where: {
      id: {
        in: topProductIds,
      },
    },
    select: {
      id: true,
      name: true,
      unit: true,
    },
  });

  const topProducts: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    revenue: number;
  }[] = topItemsGroup.map((item) => {
    const p = topProductsData.find(
      (prod) => prod.id === item.productId
    );

    let unitStr = "PCS";

    if (p?.unit) {
      if (
        typeof p.unit === "object" &&
        "name" in p.unit
      ) {
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
      revenue: Number(item._sum.subtotal || 0),
    };
  });

  // Prepare Chart Data
  const chartMap = new Map<string, { revenue: number; profit: number }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      sevenDaysAgo.getFullYear(),
      sevenDaysAgo.getMonth(),
      sevenDaysAgo.getDate() + i
    );

    const dateStr = d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
    });

    chartMap.set(dateStr, { revenue: 0, profit: 0 });
  }

  last7DaysOrders.forEach((order) => {
    const dateStr = order.createdAt.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
    });

    if (chartMap.has(dateStr)) {
      const data = chartMap.get(dateStr)!;
      chartMap.set(dateStr, {
        ...data,
        revenue: data.revenue + Number(order.totalAmount),
      });
    }
  });

  last7DaysItems.forEach((item) => {
    const dateStr = item.order.createdAt.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
    });

    if (chartMap.has(dateStr)) {
      const data = chartMap.get(dateStr)!;
      const sell = Number(item.sellPrice) || 0;
      const buy = Number(item.buyPrice) || 0;
      const profit = (sell - buy) * item.quantity;
      chartMap.set(dateStr, {
        ...data,
        profit: data.profit + profit,
      });
    }
  });

  const chartData = Array.from(chartMap.entries()).map(
    ([date, data]) => ({
      date,
      revenue: data.revenue,
      profit: data.profit,
    })
  );

  // Calculate Shift Variance
  let shiftVariance = 0;
  let hasVariance = false;
  if (lastClosedShift && lastClosedShift.closingBalance && lastClosedShift.expectedBalance) {
    shiftVariance = Number(lastClosedShift.closingBalance) - Number(lastClosedShift.expectedBalance);
    hasVariance = true;
  }

  return (
    <>
      <AdminHeader title="Dashboard" />

      <main
        className="
          flex-1
          overflow-y-auto
          bg-[#F5F5DC]/60
          px-4
          pb-24
          pt-4
        "
      >
        <div className="mx-auto w-full max-w-2xl space-y-4">

          {/* ─────────────────────────────────────
              Active Shift Alert
          ───────────────────────────────────── */}
          {activeShift && (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600 mt-0.5 sm:mt-0">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-800">Shift Kasir Aktif</h3>
                  <p className="text-xs text-orange-700/80 mt-0.5">
                    Dibuka sejak: {activeShift.openedAt.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              <Link 
                href={`/${storeId}/pos`} 
                className="bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
              >
                Ke Halaman Kasir
              </Link>
            </div>
          )}

          {/* ─────────────────────────────────────
              Last Shift Variance
          ───────────────────────────────────── */}
          {hasVariance && (
            <div className={`rounded-2xl border p-4 shadow-sm flex items-start gap-3 ${
              shiftVariance < 0 ? 'bg-red-50 border-red-200' : shiftVariance > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`p-2 rounded-xl ${
                shiftVariance < 0 ? 'bg-red-100 text-red-600' : shiftVariance > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
              }`}>
                {shiftVariance < 0 ? <AlertCircle className="size-5" /> : <CheckCircle2 className="size-5" />}
              </div>
              <div>
                <h3 className={`font-bold ${
                  shiftVariance < 0 ? 'text-red-800' : shiftVariance > 0 ? 'text-emerald-800' : 'text-slate-700'
                }`}>
                  Evaluasi Kasir Terakhir
                </h3>
                <p className={`text-xs mt-0.5 ${
                  shiftVariance < 0 ? 'text-red-700/80' : shiftVariance > 0 ? 'text-emerald-700/80' : 'text-slate-500'
                }`}>
                  {shiftVariance < 0 
                    ? `Perhatian: Terdapat kekurangan uang/selisih minus sebesar ${formatRupiah(Math.abs(shiftVariance))}.` 
                    : shiftVariance > 0
                    ? `Terdapat kelebihan uang laci sebesar ${formatRupiah(shiftVariance)}.`
                    : 'Uang laci seimbang (balance). Kerja bagus!'}
                </p>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────
              Low Stock
          ───────────────────────────────────── */}

          <section
            className="
              rounded-2xl
              border border-[#E8DFB5]
              bg-white
              p-5
              shadow-sm
            "
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="
                  flex size-10
                  items-center justify-center
                  rounded-xl
                  bg-[#FFF0D6]
                  text-[#E67E00]
                "
              >
                <AlertCircle className="size-[18px]" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  Peringatan Stok Tipis
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Produk yang perlu segera diperhatikan
                </p>
              </div>
            </div>

            {lowStockProducts.length === 0 ? (
              <div
                className="
                  rounded-xl
                  border border-dashed
                  border-[#E8DFB5]
                  bg-[#FFFCF1]
                  px-4
                  py-7
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    mb-2
                    flex size-10
                    items-center justify-center
                    rounded-full
                    bg-[#FFF3DD]
                    text-[#FF8F00]
                  "
                >
                  <Package className="size-5" />
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  Semua stok aman
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Tidak ada produk yang perlu direstock.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      border
                      border-[#F1E8C8]
                      bg-[#FFFCF1]
                      p-3
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                        Minimum stok: {product.minStockWarning}
                      </p>
                    </div>

                    <div
                      className="
                        shrink-0
                        rounded-lg
                        bg-red-50
                        px-3
                        py-1.5
                        text-xs
                        font-bold
                        text-red-600
                      "
                    >
                      Sisa {product.currentStock}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────
              Monthly Summary
          ───────────────────────────────────── */}

          <section
            className="
              rounded-2xl
              border border-[#E8DFB5]
              bg-white
              p-5
              shadow-sm
            "
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="
                  flex size-10
                  items-center justify-center
                  rounded-xl
                  bg-[#FFF8D9]
                  text-[#D99A00]
                "
              >
                <BarChart3 className="size-[18px]" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  Performa Bulan Ini 
                </h3>

                <p className="text-sm font-semibold text-[#FF8F00]">
                  ( {monthOrders.length} ) Transaksi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div
                className="
                  rounded-xl
                  border border-[#F1E8C8]
                  bg-[#FFFCF1]
                  p-4
                "
              >
                <p className="text-[15px] text-[#FF8F00]">
                  Total Omset 
                </p>
                <p className="truncate text-lg font-black tracking-tight text-[#FF8F00]">
                  {formatRupiah(monthRevenue)}
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border border-[#F1E8C8]
                  bg-[#FFFCF1]
                  p-4
                "
              >
                <p className="text-[15px] text-emerald-600">
                  Total Laba
                </p>
                <p className="truncate text-lg font-black tracking-tight text-emerald-600">
                  {formatRupiah(monthProfit)}
                </p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────
              Weekly Chart
          ───────────────────────────────────── */}

          <section
            className="
              rounded-2xl
              border border-[#E8DFB5]
              bg-white
              p-5
              shadow-sm
            "
          >
            <div className="mb-5 flex items-center gap-3">
              <div
                className="
                  flex size-10
                  items-center justify-center
                  rounded-xl
                  bg-[#FFF3DD]
                  text-[#FF8F00]
                "
              >
                <Activity className="size-[18px]" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  Omset 7 Hari Terakhir
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Performa penjualan toko
                </p>
              </div>
            </div>

            <DashboardChart data={chartData} />
          </section>

          {/* ─────────────────────────────────────
              Top Products
          ───────────────────────────────────── */}

          <section
            className="
              rounded-2xl
              border border-[#E8DFB5]
              bg-white
              p-5
              shadow-sm
            "
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="
                  flex size-10
                  items-center justify-center
                  rounded-xl
                  bg-[#FFF3DD]
                  text-[#FF8F00]
                "
              >
                <Trophy className="size-[18px]" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  5 Produk Terlaris
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Berdasarkan jumlah terjual
                </p>
              </div>
            </div>

            <div>
              {topProducts.length === 0 ? (
                <div
                  className="
                    rounded-xl
                    border border-dashed
                    border-[#E8DFB5]
                    bg-[#FFFCF1]
                    py-6
                    text-center
                    text-xs
                    text-slate-400
                  "
                >
                  Belum ada data penjualan bulan ini.
                </div>
              ) : (
                topProducts.map((p, i) => (
                  <div
                    key={p.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      border-b
                      border-slate-100
                      py-3
                      last:border-0
                      last:pb-0
                    "
                  >
                    <div className="flex min-w-0 items-center gap-3">

                      {/* Rank */}

                      <span
                        className={`
                          flex
                          size-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          text-xs
                          font-black

                          ${
                            i === 0
                              ? "bg-[#FFF0C2] text-[#D99A00]"
                              : i === 1
                              ? "bg-slate-100 text-slate-500"
                              : i === 2
                              ? "bg-[#FFF3DD] text-[#D97706]"
                              : "bg-slate-50 text-slate-400"
                          }
                        `}
                      >
                        {i + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-700">
                          {p.name}
                        </p>

                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                          {p.quantity} {p.unit} terjual
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-[#FF8F00]">
                      {formatRupiah(p.revenue)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
