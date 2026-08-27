"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Receipt } from "lucide-react";
import { closeShift } from "@/actions/shift.actions";
import Link from "next/link";

interface CloseShiftClientProps {
  storeId: string;
  shiftId: string;
  openingBalance: number;
  expectedBalance: number;
  cashSales: number;
}

export function CloseShiftClient({
  storeId,
  shiftId,
  openingBalance,
  expectedBalance,
  cashSales,
}: CloseShiftClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actualBalance, setActualBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualBalance) return;

    setError("");

    startTransition(async () => {
      const result = await closeShift(shiftId, Number(actualBalance), notes);

      if (result.success) {
        router.push(`/${storeId}`); // Go back to dashboard
      } else {
        setError(result.message || "Gagal menutup shift");
      }
    });
  };

  const difference = Number(actualBalance) - expectedBalance;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/${storeId}/pos`}
          className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tutup Shift</h1>
          <p className="text-xs text-slate-500">Hitung kas aktual di laci</p>
        </div>
      </div>

      <div className="mb-6 space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Modal Awal</span>
          <span className="font-semibold text-slate-700">{formatRupiah(openingBalance)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Penjualan Tunai</span>
          <span className="font-semibold text-slate-700">+{formatRupiah(cashSales)}</span>
        </div>
        <div className="border-t border-slate-200 my-2" />
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-slate-700">Ekspektasi Saldo Akhir</span>
          <span className="font-bold text-[#FF8F00]">{formatRupiah(expectedBalance)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div>
          <Label>Total Kas Aktual (Dihitung Manual)</Label>
          <Input
            type="number"
            value={actualBalance}
            onChange={(e) => setActualBalance(e.target.value)}
            placeholder="Masukkan uang yang ada di laci..."
            className="mt-1 h-12 rounded-xl text-lg font-bold"
            required
          />
        </div>

        {actualBalance && (
          <div className={`rounded-xl p-3 text-sm border ${difference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : difference > 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <span className="font-semibold">Selisih: </span>
            {formatRupiah(difference)}
            {difference !== 0 && (
              <span className="block mt-1 text-xs opacity-80">
                {difference > 0 ? "Kelebihan kas" : "Kekurangan kas"}
              </span>
            )}
          </div>
        )}

        <div>
          <Label>Catatan (Opsional)</Label>
          <Input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alasan selisih jika ada..."
            className="mt-1 h-11 rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending || !actualBalance}
          className="mt-4 h-12 w-full rounded-xl bg-[#FF8F00] text-base font-bold text-white hover:bg-[#e68100]"
        >
          {isPending ? <Loader2 className="mr-2 animate-spin" /> : "Selesaikan Shift"}
        </Button>
      </form>
    </div>
  );
}
