"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Loader2,
  ArrowRight,
  MapPin,
  Check,
  Zap,
  Cloud,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateStoreWithTrialAction,
  createPaidStoreTokenAction,
  completePaidStoreActivationAction,
  type PaidPlan,
} from "@/actions/subscription.actions";

type PlanOption =
  | "TRIAL"
  | "MOBILE_MONTHLY"
  | "COMBO_MONTHLY"
  | "MOBILE_YEARLY"
  | "COMBO_YEARLY";

export default function OnboardingPage() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>("TRIAL");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Dynamic load Midtrans Snap script
  useEffect(() => {
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    const snapScriptUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const scriptId = "midtrans-snap-onboarding";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = snapScriptUrl;
      if (clientKey) {
        script.setAttribute("data-client-key", clientKey);
      }
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!name.trim()) {
      setError("Nama toko wajib diisi");
      return;
    }

    startTransition(async () => {
      // 1. OPSI TRIAL (100% LOKAL GRATIS 14 HARI)
      if (selectedPlan === "TRIAL") {
        const res = await activateStoreWithTrialAction({
          name: name.trim(),
          address: address.trim() || undefined,
        });

        if (res.success && res.data) {
          router.push(`/${res.data.slug}/products`);
          router.refresh();
        } else if (res.errors) {
          setFieldErrors(res.errors);
        } else {
          setError(res.message || "Gagal membuat toko trial");
        }
        return;
      }

      // 2. OPSI BERBAYAR (MIDTRANS SNAP)
      const tokenRes = await createPaidStoreTokenAction({
        storeName: name.trim(),
        storeAddress: address.trim() || undefined,
        plan: selectedPlan as PaidPlan,
      });

      if (!tokenRes.success || !tokenRes.data) {
        setError(tokenRes.message || "Gagal menyiapkan pembayaran");
        return;
      }

      const { token, orderId } = tokenRes.data;

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async (result: Record<string, unknown>) => {
            const activationRes = await completePaidStoreActivationAction({
              orderId,
              storeName: name.trim(),
              storeAddress: address.trim() || undefined,
              plan: selectedPlan as PaidPlan,
              paymentType: typeof result?.payment_type === "string" ? result.payment_type : undefined,
            });

            if (activationRes.success && activationRes.data) {
              router.push(`/${activationRes.data.slug}`);
              router.refresh();
            } else {
              setError("Pembayaran berhasil, tapi aktivasi otomatis tertunda. Hubungi admin.");
            }
          },
          onPending: () => {
            setError("Menunggu penyelesaian pembayaran Anda.");
          },
          onError: () => {
            setError("Pembayaran gagal. Silakan coba kembali.");
          },
          onClose: () => {
            setError("Pembayaran dibatalkan.");
          },
        });
      } else {
        setError("Layanan pembayaran Snap belum termuat. Coba beberapa saat lagi.");
      }
    });
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col justify-center">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF8F00] shadow-lg shadow-orange-500/20">
            <Store className="size-8 text-white" strokeWidth={2.2} />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Buat Toko Baru Anda
          </h1>

          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
            Pilih paket dan isi data toko untuk mulai menggunakan sistem kasir WarungKu.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Global Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Store Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                Nama Warung / Toko <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Toko Berkah Mandiri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
                disabled={isPending}
                autoFocus
              />
              {fieldErrors.name && (
                <p className="text-xs font-medium text-red-500">{fieldErrors.name[0]}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                Alamat <span className="text-xs font-normal text-slate-400">(Opsional)</span>
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="address"
                  type="text"
                  placeholder="Contoh: Jl. Merdeka No. 10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 pr-4 focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-2.5 pt-2">
              <Label className="text-sm font-semibold text-slate-700">Pilih Paket Lisensi</Label>

              <div className="grid gap-3">
                {/* 1. Trial 5 Hari */}
                <div
                  onClick={() => !isPending && setSelectedPlan("TRIAL")}
                  className={`relative cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                    selectedPlan === "TRIAL"
                      ? "border-[#FF8F00] bg-orange-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <HardDrive className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">Trial 5 Hari</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            GRATIS
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Operasional 100% lokal di mobile, tanpa kartu kredit</p>
                      </div>
                    </div>
                    <div
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        selectedPlan === "TRIAL"
                          ? "border-[#FF8F00] bg-[#FF8F00] text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedPlan === "TRIAL" && <Check className="size-3.5" />}
                    </div>
                  </div>
                </div>

                {/* 2. Mobile Pro Bulanan (Target Utama) */}
                <div
                  onClick={() => !isPending && setSelectedPlan("MOBILE_MONTHLY")}
                  className={`relative cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                    selectedPlan === "MOBILE_MONTHLY"
                      ? "border-[#FF8F00] bg-orange-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF8F00]">
                        <Cloud className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">Mobile Pro</span>
                          <span className="rounded-full bg-orange-100 px-1.5 py-0.2 text-[9px] font-bold text-orange-700">
                            POPULER
                          </span>
                          <span className="text-xs font-extrabold text-[#FF8F00]">Rp 49.000</span>
                          <span className="text-[11px] text-slate-400">/bln</span>
                        </div>
                        <p className="text-xs text-slate-500">Full Mobile POS + Cloud Sync EOD (Web: Dashboard & Profil)</p>
                      </div>
                    </div>
                    <div
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        selectedPlan === "MOBILE_MONTHLY"
                          ? "border-[#FF8F00] bg-[#FF8F00] text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedPlan === "MOBILE_MONTHLY" && <Check className="size-3.5" />}
                    </div>
                  </div>
                </div>

                {/* 3. Combo Pro Bulanan (Web + Mobile) */}
                <div
                  onClick={() => !isPending && setSelectedPlan("COMBO_MONTHLY")}
                  className={`relative cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                    selectedPlan === "COMBO_MONTHLY"
                      ? "border-[#FF8F00] bg-orange-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <Zap className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">Combo Pro (Web + Mobile)</span>
                          <span className="text-xs font-extrabold text-[#FF8F00]">Rp 99.000</span>
                          <span className="text-[11px] text-slate-400">/bln</span>
                        </div>
                        <p className="text-xs text-slate-500">Akses Penuh Mobile POS + Web POS & Manajemen Produk di Browser</p>
                      </div>
                    </div>
                    <div
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        selectedPlan === "COMBO_MONTHLY"
                          ? "border-[#FF8F00] bg-[#FF8F00] text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedPlan === "COMBO_MONTHLY" && <Check className="size-3.5" />}
                    </div>
                  </div>
                </div>

                {/* 4. Opsi Tahunan Hemat */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("MOBILE_YEARLY")}
                    className={`flex-1 rounded-xl border p-2 text-left transition-all ${
                      selectedPlan === "MOBILE_YEARLY"
                        ? "border-[#FF8F00] bg-orange-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-[11px] font-bold text-slate-800">Mobile Pro Tahunan</p>
                    <p className="text-[10px] font-extrabold text-[#FF8F00]">Rp 490.000 / thn</p>
                    <p className="text-[9px] text-emerald-600 font-medium">Hemat 2 Bulan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan("COMBO_YEARLY")}
                    className={`flex-1 rounded-xl border p-2 text-left transition-all ${
                      selectedPlan === "COMBO_YEARLY"
                        ? "border-[#FF8F00] bg-orange-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-[11px] font-bold text-slate-800">Combo Tahunan (Web+HP)</p>
                    <p className="text-[10px] font-extrabold text-[#FF8F00]">Rp 990.000 / thn</p>
                    <p className="text-[9px] text-emerald-600 font-medium">Hemat 2 Bulan</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={isPending || !name.trim()}
                className="h-12 w-full rounded-xl bg-[#FF8F00] text-[15px] font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-[#F57C00] hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Memproses...
                  </>
                ) : selectedPlan === "TRIAL" ? (
                  <>
                    Mulai Trial 14 Hari (Gratis)
                    <ArrowRight className="ml-2 size-5" />
                  </>
                ) : (
                  <>
                    Bayar & Aktifkan Toko
                    <ShieldCheck className="ml-2 size-5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[12px] text-slate-400">
          Pembayaran resmi & aman didukung oleh <span className="font-semibold text-slate-600">Midtrans</span>.
        </p>
      </div>
    </main>
  );
}