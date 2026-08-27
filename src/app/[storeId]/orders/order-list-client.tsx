"use client";

import { useState, useEffect } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { OrderCard } from "@/components/modules/order/order-card";
import { getOrdersPaginated } from "@/actions/order.actions";
import { useInView } from "react-intersection-observer";

interface OrderListClientProps {
  storeId: string;
  initialOrders: any[];
  initialHasMore: boolean;
}

export function OrderListClient({ storeId, initialOrders, initialHasMore }: OrderListClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { ref, inView } = useInView();

  // Handle Infinite Scroll
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      const loadMore = async () => {
        setIsLoadingMore(true);
        const nextPage = page + 1;
        const res = await getOrdersPaginated(storeId, nextPage, 20);
        if (res.success && res.data && res.meta) {
          setOrders(prev => [...prev, ...(res.data || [])]);
          setPage(nextPage);
          setHasMore(res.meta.hasMore);
        }
        setIsLoadingMore(false);
      };
      loadMore();
    }
  }, [inView, hasMore, isLoadingMore, page, storeId]);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8DFB5] bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#F5F5DC] text-[#C8B96B]">
          <ShoppingBag className="size-7" />
        </div>
        <h3 className="font-bold text-slate-800">
          Belum ada transaksi
        </h3>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
          Transaksi yang berhasil dilakukan akan muncul di halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
        />
      ))}
      
      {hasMore && (
        <div ref={ref} className="py-6 flex justify-center items-center">
          <Loader2 className="size-6 animate-spin text-[#FF8F00]" />
        </div>
      )}
    </div>
  );
}
