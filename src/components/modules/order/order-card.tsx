"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Package,
  Receipt,
  X,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

import type { Order, OrderItem, Product } from "@/generated/prisma/client";

interface OrderCardProps {
  order: Order & {
    items: (OrderItem & {
      product: Product;
    })[];
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const formattedDate = new Date(order.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      {/* =========================================================
          ORDER CARD
      ========================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group w-full rounded-2xl border border-[#EDE8D2] bg-white p-4 text-left shadow-sm transition-all hover:border-[#FBC02D]/60 hover:shadow-md active:scale-[0.99]"
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0D6] text-[#FF8F00] transition-colors group-hover:bg-[#FF8F00] group-hover:text-white">
              <Receipt className="size-5" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-800">
                {order.invoiceNo}
              </h3>

              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                <Calendar className="size-3" />
                {formattedDate}
              </p>
            </div>
          </div>

          <ChevronRight className="size-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#FF8F00]" />
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-slate-100" />

        {/* Bottom Info */}
        <div className="flex items-end justify-between gap-3">

          <div>
            <p className="text-xs font-medium text-slate-500">
              {itemCount} item
              {itemCount !== 1 ? "s" : ""}
            </p>

            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F5F5DC] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#A66A00]">
                <CreditCard className="size-3" />
                {order.paymentType}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-400">
              Total
            </span>

            <p className="mt-0.5 text-base font-black text-[#FF8F00]">
              {formatRupiah(order.totalAmount)}
            </p>
          </div>

        </div>
      </button>

      {/* =========================================================
          DETAIL MODAL
      ========================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">

          {/* Overlay */}
          <button
            type="button"
            aria-label="Tutup detail transaksi"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl animate-in slide-in-from-bottom-full duration-300">

            {/* Handle */}
            <div className="flex shrink-0 justify-center pb-2 pt-3">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#F5F5DC] px-5 pb-4 pt-2">

              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF0D6] text-[#FF8F00]">
                  <Receipt className="size-5" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Detail Transaksi
                  </h2>

                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {order.invoiceNo}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 active:scale-95"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">

              {/* Transaction Info */}
              <div className="rounded-2xl border border-[#EDE8D2] bg-[#F5F5DC]/40 p-4">

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Tanggal & Waktu
                  </span>

                  <span className="text-right text-xs font-semibold text-slate-700">
                    {new Date(order.createdAt).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="my-3 border-t border-[#EDE8D2]" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Pembayaran
                  </span>

                  <span className="rounded-md bg-[#FFF0D6] px-2 py-1 text-[10px] font-bold uppercase text-[#C27800]">
                    {order.paymentType}
                  </span>
                </div>

                <div className="my-3 border-t border-[#EDE8D2]" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3" />
                    BERHASIL
                  </span>
                </div>

              </div>

              {/* Items */}
              <div className="mt-6">

                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Package className="size-4 text-[#FF8F00]" />
                    Daftar Item
                  </h4>

                  <span className="text-[10px] font-medium text-slate-400">
                    {itemCount} item
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#EDE8D2]">

                  {order.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-4 p-4 ${
                        index !== order.items.length - 1
                          ? "border-b border-[#F5F5DC]"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight text-slate-800">
                          {item.product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.quantity} ×{" "}
                          {formatRupiah(item.sellPrice)}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-slate-800">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}

                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mt-6 space-y-2.5 text-sm">

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Total Belanja
                  </span>

                  <span className="font-semibold text-slate-700">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Dibayar
                  </span>

                  <span className="font-semibold text-slate-700">
                    {formatRupiah(order.paidAmount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Kembalian
                  </span>

                  <span className="font-semibold text-emerald-600">
                    {formatRupiah(order.changeAmount)}
                  </span>
                </div>

              </div>

            </div>

            {/* Total Footer */}
            <div className="shrink-0 border-t border-[#EDE8D2] bg-white p-5">

              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#FFF8D6] to-[#FFF0D6] p-4 ring-1 ring-[#FBC02D]/20">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#A66A00]">
                    Total Transaksi
                  </p>

                  <p className="mt-0.5 text-xs text-[#C27800]">
                    Pembayaran berhasil
                  </p>
                </div>

                <span className="text-xl font-black text-[#FF8F00]">
                  {formatRupiah(order.totalAmount)}
                </span>

              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
