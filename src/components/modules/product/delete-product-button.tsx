"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteProduct } from "@/actions/product.actions";

interface DeleteProductButtonProps {
  storeId: string;
  productId: string;
}

export function DeleteProductButton({
  storeId,
  productId,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = () => {
    setError("");
    startTransition(async () => {
      const result = await deleteProduct(storeId, { id: productId });
      if (result.success) {
        setOpen(false);
        router.push(`/${storeId}/products`);
        router.refresh();
      } else {
        setError(result.message ?? "Gagal menghapus produk");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            className="w-full h-12 rounded-xl font-semibold"
          />
        }
      >
        <Trash2 className="size-4 mr-2" />
        Hapus Produk
      </DialogTrigger>
      <DialogContent className="max-w-[calc(28rem-2rem)] rounded-xl">
        <DialogHeader>
          <DialogTitle>Hapus Produk?</DialogTitle>
          <DialogDescription>
            Produk yang dihapus tidak dapat dikembalikan. Semua data stok terkait
            juga akan hilang.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-500 px-1">{error}</p>
        )}
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Menghapus...
              </>
            ) : (
              "Ya, Hapus"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
