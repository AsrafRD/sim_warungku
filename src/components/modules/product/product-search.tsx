"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductSearchProps {
  /** Placeholder text */
  placeholder?: string;
}

export function ProductSearch({
  placeholder = "Cari produk...",
}: ProductSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("search", term);
        params.delete("page"); // Reset pagination on new search
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSearch(newValue), 350);
  };

  const handleClear = () => {
    setValue("");
    updateSearch("");
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="h-11 rounded-xl bg-white pl-10 pr-10 text-sm shadow-sm border-slate-200 placeholder:text-slate-400"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-colors active:bg-slate-300"
          aria-label="Hapus pencarian"
        >
          <X className="size-3" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      )}
    </div>
  );
}
