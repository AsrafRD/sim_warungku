"use client";

import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/generated/prisma/client";

interface ProductCardProps {
  product: any;
  storeId: string;
}

export function ProductCard({ product, storeId }: ProductCardProps) {
  const isLowStock = product.currentStock <= product.minStockWarning;

  return (
    <Link
      href={`/${storeId}/products/${product.id}/edit`}
      className="flex items-center gap-4 bg-white px-4 py-3 border-b border-slate-100 active:bg-slate-50 transition-colors"
    >
      <div className="relative flex h-12 w-12 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <Package className="size-6" />
        )}
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
