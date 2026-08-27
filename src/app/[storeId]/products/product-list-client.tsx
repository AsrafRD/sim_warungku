"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/modules/product/product-card";
import { getProducts } from "@/actions/product.actions";
import { useInView } from "react-intersection-observer";

interface ProductListClientProps {
  storeId: string;
  initialProducts: any[];
  searchQuery: string;
  initialHasMore: boolean;
}

export function ProductListClient({ storeId, initialProducts, searchQuery, initialHasMore }: ProductListClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { ref, inView } = useInView();

  // Reset logic is handled via 'key' prop in the parent component

  // Handle Infinite Scroll
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      const loadMore = async () => {
        setIsLoadingMore(true);
        const nextPage = page + 1;
        const res = await getProducts(storeId, { search: searchQuery, page: nextPage, limit: 20 });
        if (res.success && res.data) {
          setProducts(prev => [...prev, ...(res.data?.products || [])]);
          setPage(nextPage);
          setHasMore(nextPage < (res.data?.totalPages || 1));
        }
        setIsLoadingMore(false);
      };
      loadMore();
    }
  }, [inView, hasMore, isLoadingMore, page, searchQuery, storeId]);

  return (
    <>
      <div className="divide-y divide-[#E8DFB5] bg-white">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            storeId={storeId}
          />
        ))}
      </div>
      
      {hasMore && (
        <div ref={ref} className="py-6 flex justify-center items-center">
          <Loader2 className="size-6 animate-spin text-[#FF8F00]" />
        </div>
      )}
    </>
  );
}
