import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { ProductCard } from "@/components/modules/product/product-card";
import { ProductSearch } from "@/components/modules/product/product-search";
import { getProducts } from "@/actions/product.actions";

interface ProductsPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { storeId } = await params;
  const { search, page } = await searchParams;

  const result = await getProducts(storeId, {
    search: search ?? undefined,
    page: page ? Number(page) : 1,
    limit: 20,
  });

  const rawProducts = result.data?.products ?? [];
  const total = result.data?.total ?? 0;

  // Serialize Decimal to number for Client Components
  const products = rawProducts.map(p => ({
    ...p,
    buyPrice: Number(p.buyPrice),
    sellPrice: Number(p.sellPrice),
  }));

  return (
    <>
      <AdminHeader title="Manajemen Produk" />

      <div className="flex-1 p-2 space-y-3">
        {/* Search bar */}
        <ProductSearch placeholder="Cari nama, SKU, barcode..." />

        {/* Product count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {total} produk ditemukan
          </p>
        </div>

        {/* Product list */}
        {products.length > 0 ? (
          <div className="space-y-2">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeId={storeId}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Package className="size-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              {search ? "Produk tidak ditemukan" : "Belum ada produk"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              {search
                ? "Coba ubah kata kunci pencarian"
                : "Tambahkan produk pertama untuk mulai berjualan"}
            </p>
          </div>
        )}
      </div>

      {/* FAB - Add Product */}
      <Link
        href={`/${storeId}/products/new`}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95 max-w-md"
        style={{ right: "max(1rem, calc((100vw - 28rem) / 2 + 1rem))" }}
      >
        <Plus className="size-6" />
      </Link>
    </>
  );
}
