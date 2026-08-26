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
} from "lucide-react";
import { DashboardChart } from "@/components/modules/admin/dashboard-chart";

interface DashboardPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function DashboardPage({
  params,
}: DashboardPageProps) {
  const { storeId } = await params;

  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

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
  ]);

  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );

  const monthRevenue = monthOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
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
  const chartMap = new Map<string, number>();

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

    chartMap.set(dateStr, 0);
  }

  last7DaysOrders.forEach((order) => {
    const dateStr = order.createdAt.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
    });

    if (chartMap.has(dateStr)) {
      chartMap.set(
        dateStr,
        chartMap.get(dateStr)! +
          Number(order.totalAmount)
      );
    }
  });

  const chartData = Array.from(chartMap.entries()).map(
    ([date, revenue]) => ({
      date,
      revenue,
    })
  );

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
              Welcome Banner
          ───────────────────────────────────── */}

          <section
            className="
              relative
              overflow-hidden
              rounded-3xl
              bg-[#FF8F00]
              p-5
              text-white
              shadow-[0_10px_30px_rgba(255,143,0,0.22)]
            "
          >
            {/* Decorative circles */}
            <div
              className="
                absolute
                -right-10
                -top-10
                size-32
                rounded-full
                bg-white/10
              "
            />

            <div
              className="
                absolute
                -bottom-16
                right-8
                size-40
                rounded-full
                bg-[#FBC02D]/20
              "
            />

            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                  <Activity className="size-5" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-white/75">
                  Dashboard Toko
                </span>
              </div>

              <h2 className="text-xl font-extrabold tracking-tight">
                Ringkasan Hari Ini
              </h2>

              <p className="mt-1 max-w-[300px] text-sm leading-relaxed text-white/80">
                Pantau penjualan dan kondisi stok toko Anda.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────
              Today's Stats
          ───────────────────────────────────── */}

          <section className="grid grid-cols-2 gap-3">

            {/* Transactions */}

            <div
              className="
                rounded-2xl
                border border-[#E8DFB5]
                bg-white
                p-4
                shadow-sm
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className="
                    flex size-9
                    items-center justify-center
                    rounded-xl
                    bg-[#FFF3DD]
                    text-[#FF8F00]
                  "
                >
                  <ShoppingBag className="size-[18px]" />
                </div>

                <ArrowUpRight className="size-4 text-slate-300" />
              </div>

              <p className="text-2xl font-black tracking-tight text-slate-800">
                {todayOrders.length}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Transaksi hari ini
              </p>
            </div>

            {/* Revenue */}

            <div
              className="
                rounded-2xl
                border border-[#E8DFB5]
                bg-white
                p-4
                shadow-sm
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className="
                    flex size-9
                    items-center justify-center
                    rounded-xl
                    bg-[#FFF8D9]
                    text-[#D99A00]
                  "
                >
                  <TrendingUp className="size-[18px]" />
                </div>

                <ArrowUpRight className="size-4 text-slate-300" />
              </div>

              <p className="truncate text-lg font-black tracking-tight text-[#FF8F00]">
                {formatRupiah(todayRevenue)}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Omset hari ini
              </p>
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

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Ringkasan bulan berjalan
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
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Omset
                </p>

                <p className="truncate text-lg font-black text-slate-800">
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
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Transaksi
                </p>

                <p className="text-lg font-black text-slate-800">
                  {monthOrders.length}
                  <span className="ml-1 text-sm font-semibold text-slate-400">
                    struk
                  </span>
                </p>
              </div>
            </div>
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

        </div>
      </main>
    </>
  );
}
