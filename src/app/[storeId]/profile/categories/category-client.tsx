"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, deleteCategory } from "@/actions/settings.actions";

export function CategoryClient({
  storeId,
  categories,
}: {
  storeId: string;
  categories: { id: string; name: string; _count?: { products: number } }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    startTransition(async () => {
      const result = await createCategory(storeId, name);
      if (result.success) {
        setName("");
        router.refresh();
      } else {
        setError(result.message || "Gagal menambah kategori");
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCategory(storeId, id);
      setDeletingId(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message || "Gagal menghapus kategori");
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Form Tambah */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3">Tambah Kategori Baru</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: Makanan Ringan"
            className="h-11 flex-1 rounded-xl"
            disabled={isPending}
          />
          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="h-11 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {isPending && !deletingId ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Plus className="size-5 mr-1" />
            )}
            Tambah
          </Button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* Daftar Kategori */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Daftar Kategori ({categories.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada kategori yang ditambahkan.
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-800">{cat.name}</h4>
                  {cat._count?.products !== undefined && (
                    <p className="text-xs text-slate-500">{cat._count.products} Produk terkait</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cat.id)}
                  disabled={isPending}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  {deletingId === cat.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
