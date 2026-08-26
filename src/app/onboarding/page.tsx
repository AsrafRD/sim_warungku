"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]>
  >({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    startTransition(async () => {
      try {
        const response = await fetch("/api/stores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          // Masuk ke dashboard toko
          router.push(`/${result.data.slug}`);
          router.refresh();
        } else if (result.errors) {
          setFieldErrors(result.errors);
        } else {
          setError(result.message || "Gagal membuat toko");
        }
      } catch {
        setError("Terjadi kesalahan jaringan");
      }
    });
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col justify-center">

        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF8F00] shadow-lg shadow-orange-500/20">
            <Store
              className="size-8 text-white"
              strokeWidth={2.2}
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Buat Toko Anda
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
            Satu langkah lagi. Isi informasi toko untuk mulai menggunakan
            sistem kasir.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Global Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Store Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-slate-700"
              >
                Nama Warung / Toko
              </Label>

              <Input
                id="name"
                type="text"
                placeholder="Contoh: Warung Berkah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
                disabled={isPending}
                autoComplete="organization"
                autoFocus
              />

              {fieldErrors.name && (
                <p className="text-xs font-medium text-red-500">
                  {fieldErrors.name[0]}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-semibold text-slate-700"
              >
                Alamat
                <span className="ml-1 font-normal text-slate-400">
                  (Opsional)
                </span>
              </Label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="address"
                  type="text"
                  placeholder="Contoh: Jl. Merdeka No. 1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 pr-4 focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
                  disabled={isPending}
                  autoComplete="street-address"
                />
              </div>

              {fieldErrors.address && (
                <p className="text-xs font-medium text-red-500">
                  {fieldErrors.address[0]}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending || !name.trim()}
                className="h-12 w-full rounded-xl bg-[#FF8F00] text-[15px] font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-[#F57C00] hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Membuat Toko...
                  </>
                ) : (
                  <>
                    Mulai Kelola Toko
                    <ArrowRight className="ml-2 size-5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] font-medium text-slate-400">
          Anda dapat mengubah informasi toko kapan saja.
        </p>
      </div>
    </main>
  );
}