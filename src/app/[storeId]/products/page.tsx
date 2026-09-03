import Link from "next/link";
import {
  Plus,
  Package,
  ChevronRight,
} from "lucide-react";

import { AdminHeader } from "@/components/modules/admin/admin-header";
import { ProductCard } from "@/components/modules/product/product-card";
import { ProductSearch } from "@/components/modules/product/product-search";
import { getProducts } from "@/actions/product.actions";
import { ProductListClient } from "./product-list-client";
import { validateStoreAccess } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface ProductsPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { storeId } = await params;
  const { search, page } = await searchParams;

  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  const sub = await db.subscription.findUnique({
    where: { storeId: storeDbId },
  });
  if (!sub?.hasWebAccess) {
    redirect(`/${storeId}`);
  }

  const result = await getProducts(storeId, {
    search: search ?? undefined,
    page: page ? Number(page) : 1,
    limit: 20,
  });

  const rawProducts = result.data?.products ?? [];
  const total = result.data?.total ?? 0;

  // Serialize Decimal to number for Client Components
  const products = rawProducts.map((p) => ({
    ...p,
    buyPrice: Number(p.buyPrice),
    sellPrice: Number(p.sellPrice),
  }));

  return (
    <>
      <AdminHeader title="Manajemen Produk" />

      <div className="flex flex-1 flex-col overflow-hidden bg-[#F5F5DC]/40">

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <div className="sticky top-0 z-10 border-b border-[#E8DFB5] bg-white/95 p-3 backdrop-blur">
          <ProductSearch
            placeholder="Cari nama, SKU, barcode..."
          />
        </div>


        {/* =====================================================
            PRODUCT SUMMARY
        ===================================================== */}

        <div className="flex items-center justify-between border-b border-[#E8DFB5] bg-[#F5F5DC]/60 px-4 py-2.5">

          <div className="flex items-center gap-2">

            <div className="flex size-6 items-center justify-center rounded-md bg-[#FFF0D6] text-[#FF8F00]">
              <Package className="size-3.5" />
            </div>

            <p className="text-xs font-semibold text-slate-600">
              {total} produk ditemukan
            </p>

          </div>

          {search && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
              Hasil pencarian
              <ChevronRight className="size-3" />
            </div>
          )}

        </div>


        {/* =====================================================
            PRODUCT LIST
        ===================================================== */}

        <div className="flex-1 overflow-y-auto pb-24">
          {products.length > 0 ? (
            <ProductListClient 
              key={search || 'default'}
              storeId={storeId}
              initialProducts={products}
              searchQuery={search || ""}
              initialHasMore={result.data ? result.data.totalPages > 1 : false}
            />
          ) : (

            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-5 flex size-20 items-center justify-center rounded-[28px] bg-[#F5F5DC] text-[#FF8F00] shadow-sm ring-1 ring-[#E8DFB5]">

                <Package className="size-9" />

              </div>

              <h3 className="text-base font-bold text-slate-800">

                {search
                  ? "Produk tidak ditemukan"
                  : "Belum ada produk"}

              </h3>

              <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-slate-500">

                {search
                  ? "Coba gunakan kata kunci lain atau periksa kembali nama produk, SKU, atau barcode."
                  : "Tambahkan produk pertama untuk mulai mengelola stok dan penjualan toko Anda."}

              </p>

              {!search && (
                <Link
                  href={`/${storeId}/products/new`}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF8F00] px-4 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-[#E98200] active:scale-95"
                >
                  <Plus className="size-4" />
                  Tambah Produk
                </Link>
              )}

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          FAB
      ===================================================== */}

      <Link
        href={`/${storeId}/products/new`}
        aria-label="Tambah produk"
        className="
          fixed
          bottom-25 right-4
          z-50
          flex size-14
          items-center justify-center
          rounded-full
          bg-[#FF8F00]
          text-white
          shadow-[0_8px_25px_rgba(255,143,0,0.35)]
          transition-all
          hover:bg-[#E98200]
          hover:shadow-[0_10px_30px_rgba(255,143,0,0.4)]
          active:scale-90
          lg:bottom-8
          lg:right-8
        "
      >
        <Plus className="size-6" />
      </Link>
    </>
  );
}
