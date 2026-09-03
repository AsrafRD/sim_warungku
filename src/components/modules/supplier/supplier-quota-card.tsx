"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coins, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupplierTokenPaymentAction } from "@/actions/supplier-token.actions";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess?: (result: Record<string, unknown>) => void;
        onPending?: (result: Record<string, unknown>) => void;
        onError?: (result: Record<string, unknown>) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface SupplierQuotaCardProps {
  linkedCount: number;
  quota: number;
  clientKey?: string;
  isProduction?: boolean;
}

export function SupplierQuotaCard({
  linkedCount,
  quota,
  clientKey,
  isProduction,
}: SupplierQuotaCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const percent = Math.min(Math.round((linkedCount / quota) * 100), 100);
  const isFull = linkedCount >= quota;

  // Load Midtrans Snap JS script
  useEffect(() => {
    const snapScriptUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const scriptId = "midtrans-snap-script";
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
  }, [clientKey, isProduction]);

  const handleBuyToken = () => {
    setError("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await createSupplierTokenPaymentAction({ tokens: 1 });
      if (!res.success || !res.data) {
        setError(res.message || "Gagal membuat transaksi");
        return;
      }

      if (window.snap) {
        window.snap.pay(res.data.token, {
          onSuccess: () => {
            setSuccessMsg("Pembayaran berhasil! Kuota bertambah +10 toko.");
            router.refresh();
          },
          onPending: () => {
            setSuccessMsg("Menunggu pembayaran diproses.");
          },
          onError: () => {
            setError("Pembayaran gagal atau dibatalkan.");
          },
          onClose: () => {
            router.refresh();
          },
        });
      } else {
        setError("Layanan pembayaran Snap belum termuat. Coba beberapa saat lagi.");
      }
    });
  };

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF8F00]/10 text-[#FF8F00]">
            <Coins className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Kuota Toko Mitra</h3>
            <p className="text-xs text-slate-500">Maksimal 10 toko per token kuota</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-extrabold text-slate-900">
            {linkedCount} / {quota}
          </span>
          <span className="ml-1 text-xs text-slate-400">Toko</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull ? "bg-red-500" : percent > 70 ? "bg-[#FF8F00]" : "bg-[#FBC02D]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}

      {successMsg && (
        <p className="mt-2 flex items-center text-xs font-medium text-emerald-600">
          <CheckCircle2 className="mr-1 size-3.5" />
          {successMsg}
        </p>
      )}

      {/* Action Button */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {isFull
            ? "⚠️ Kuota penuh. Beli token untuk menambah toko baru."
            : `Sisa slot: ${quota - linkedCount} toko`}
        </p>

        <Button
          type="button"
          onClick={handleBuyToken}
          disabled={isPending}
          size="sm"
          className="rounded-xl bg-[#FF8F00] hover:bg-[#e68100] text-white font-semibold text-xs h-9 px-3.5 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Plus className="mr-1 size-3.5" />
              Beli Token (+10 Toko)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
