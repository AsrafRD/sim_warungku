"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Smartphone, Zap, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createStoreRenewalTokenAction,
  completeStoreRenewalAction,
  type PaidPlan,
} from "@/actions/subscription.actions";

interface BillingReminderBannerProps {
  storeId: string;
  storeName: string;
  status: string;
  plan: string;
  hasWebAccess: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export function BillingReminderBanner({
  storeId,
  storeName,
  status,
  plan,
  hasWebAccess,
  trialEndsAt,
  currentPeriodEnd,
}: BillingReminderBannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<PaidPlan | null>(null);

  const now = new Date();
  const targetDate = trialEndsAt ? new Date(trialEndsAt) : currentPeriodEnd ? new Date(currentPeriodEnd) : null;

  let daysRemaining = 999;
  if (targetDate) {
    const diffTime = targetDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const isExpired = status === "EXPIRED" || daysRemaining <= 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 2; // H-2 Reminder Sesuai Instruksi

  const handleRenew = async (targetPlan: PaidPlan) => {
    setIsProcessing(true);
    try {
      const res = await createStoreRenewalTokenAction({
        storeId,
        plan: targetPlan,
      });

      if (res.success && res.data && window.snap) {
        window.snap.pay(res.data.token, {
          onSuccess: async (result: Record<string, unknown>) => {
            await completeStoreRenewalAction({
              storeId,
              orderId: res.data!.orderId,
              plan: targetPlan,
              paymentType: typeof result?.payment_type === "string" ? result.payment_type : undefined,
            });
            window.location.reload();
          },
          onError: () => {
            alert("Pembayaran perpanjangan gagal atau dibatalkan.");
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        alert(res.message || "Gagal menyiapkan pembayaran perpanjangan");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedDate = targetDate
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(targetDate)
    : "-";

  return (
    <div className="space-y-3 px-4 pt-3">
      {/* 1. KONDISI EXPIRED (MERAH) */}
      {isExpired && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-red-900">Masa Aktif Lisensi Telah Berakhir</h4>
                <span className="rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-extrabold text-red-800">
                  EXPIRED
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-red-700">
                Data operasional dan kasir di HP Anda <strong>tetap tersimpan aman</strong>. Namun sinkronisasi cloud dan pembuatan shift ditangguhkan.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleRenew("MOBILE_MONTHLY")}
                  className="h-8 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
                >
                  Perpanjang Mobile Pro (Rp 49.000)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleRenew("COMBO_MONTHLY")}
                  className="h-8 rounded-lg border-red-300 bg-white px-3 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  Upgrade Combo Web+HP (Rp 99.000)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. KONDISI PERINGATAN H-2 / H-1 (KUNING/AMBER) */}
      {isExpiringSoon && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Clock className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950">
                  {status === "TRIAL" ? "Masa Trial Segera Berakhir" : "Masa Aktif Segera Berakhir"}
                </h4>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                  H-{daysRemaining} ({daysRemaining === 1 ? "1 Hari Lagi" : `${daysRemaining} Hari Lagi`})
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Lisensi toko Anda akan jatuh tempo pada <strong>{formattedDate}</strong>. Segera perpanjang agar sinkronisasi cloud cabang tetap aktif tanpa gangguan.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleRenew("MOBILE_MONTHLY")}
                  className="h-8 rounded-lg bg-[#FF8F00] px-3 text-xs font-bold text-white hover:bg-[#F57C00]"
                >
                  Perpanjang Mobile Pro (Rp 49.000)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleRenew("COMBO_MONTHLY")}
                  className="h-8 rounded-lg border-amber-400 bg-white px-3 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  Upgrade Combo Web+HP (Rp 99.000)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CARD EDUKASI APLIKASI MOBILE (BAGI PENGGUNA MOBILE ONLY) */}
      {!hasWebAccess && !isExpired && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#FF8F00]">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Operasional Kasir Aktif di Aplikasi Mobile</h4>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  Gunakan aplikasi mobile untuk scan barcode, cetak struk thermal, dan transaksi POS harian.
                </p>
                <div className="mt-2.5 flex items-center gap-3">
                  <a
                    href="#download"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8F00] hover:underline"
                  >
                    Buka / Install Aplikasi Mobile
                    <ArrowUpRight className="size-3.5" />
                  </a>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleRenew("COMBO_MONTHLY")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    Ingin POS di Browser? Upgrade Combo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
