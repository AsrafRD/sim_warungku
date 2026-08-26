"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/generated/prisma/client";

interface ProductCardProps {
  product: Product & {
    supplier: { id: string; name: string } | null;
  };
  storeId: string;
}

export function ProductCard({ product, storeId }: ProductCardProps) {
  const isLowStock = product.currentStock <= product.minStockWarning;

  return (
    <Link
      href={`/${storeId}/products/${product.id}`}
      className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-slate-100 transition-colors active:bg-slate-50"
    >
      {/* Product thumbnail placeholder */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100">
        <Package className="size-6 text-slate-400" />
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 truncate">
          {product.name}
        </h3>
        <p className="text-sm font-bold text-slate-700 mt-0.5">
          {formatRupiah(Number(product.sellPrice))}
        </p>
        {product.supplier && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {product.supplier.name}
          </p>
        )}
      </div>

      {/* Stock badge */}
      <div className="shrink-0">
        <Badge
          variant={isLowStock ? "destructive" : "secondary"}
          className="text-[11px] font-medium"
        >
          {product.currentStock} stok
        </Badge>
      </div>
    </Link>
  );
}
