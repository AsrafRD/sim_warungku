"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStoreAction } from "@/actions/store.actions";

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await createStoreAction({ name, address });
      
      if (result.success && result.data) {
        router.push(`/${result.data.slug}/products`);
        router.refresh();
      } else if (result.errors) {
        setFieldErrors(result.errors);
      } else {
        setError(result.message || "Gagal membuat toko");
      }
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20 mb-6">
            <Store className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Satu Langkah Lagi!
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-[280px] mx-auto">
            Mari buat profil warung Anda untuk mulai menggunakan sistem kasir.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Warung / Toko</Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Warung Berkah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isPending}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Alamat (Opsional)</Label>
              <Input
                id="address"
                type="text"
                placeholder="Contoh: Jl. Merdeka No.1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isPending}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[15px] transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Membuat Toko...
                  </>
                ) : (
                  <>
                    Lanjut ke Dashboard
                    <ArrowRight className="size-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
