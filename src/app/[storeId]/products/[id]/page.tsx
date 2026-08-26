import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProductById } from "@/actions/product.actions";
import { formatRupiah } from "@/lib/format";
import { DeleteProductButton } from "@/components/modules/product/delete-product-button";

interface ProductDetailPageProps {
  params: Promise<{ storeId: string; id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { storeId, id } = await params;

  const result = await getProductById(storeId, id);
  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;
  const isLowStock = product.currentStock <= product.minStockWarning;
  const margin = Number(product.sellPrice) - Number(product.buyPrice);
  const marginPercent =
    Number(product.buyPrice) > 0
      ? ((margin / Number(product.buyPrice)) * 100).toFixed(1)
      : "0";

  return (
    <>
      <AdminHeader
        title="Detail Produk"
        showBack
        rightAction={
          <Link
            href={`/${storeId}/products/${product.id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:bg-white/10"
            aria-label="Edit Produk"
          >
            <Pencil className="size-5 text-white" />
          </Link>
        }
      />

      <div className="flex-1 p-4 space-y-4">
        {/* Product image placeholder */}
        <div className="flex h-48 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-slate-100 mb-2">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-xs text-slate-400">Belum ada foto</p>
          </div>
        </div>

        {/* Product info card */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {product.name}
              </h2>
              {product.supplier && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Supplier: {product.supplier.name}
                </p>
              )}
            </div>
            <Badge
              variant={isLowStock ? "destructive" : "secondary"}
              className="text-xs font-medium shrink-0"
            >
              Stok: {product.currentStock}
            </Badge>
          </div>

          {isLowStock && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
              <AlertTriangle className="size-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                Stok rendah! Minimum: {product.minStockWarning}
              </p>
            </div>
          )}

          <Separator />

          {/* Price details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                Harga Beli
              </p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {formatRupiah(Number(product.buyPrice))}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                Harga Jual
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {formatRupiah(Number(product.sellPrice))}
              </p>
            </div>
          </div>

          {/* Margin */}
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-[11px] text-emerald-600 font-medium uppercase tracking-wide">
              Margin Keuntungan
            </p>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">
              {formatRupiah(margin)}{" "}
              <span className="text-xs font-medium">({marginPercent}%)</span>
            </p>
          </div>

          <Separator />

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                SKU
              </p>
              <p className="text-sm text-slate-700 mt-0.5 font-mono">
                {product.sku || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                Barcode
              </p>
              <p className="text-sm text-slate-700 mt-0.5 font-mono">
                {product.barcode || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Delete button */}
        <DeleteProductButton storeId={storeId} productId={product.id} />
      </div>
    </>
  );
}
