"use client";

import { useState } from "react";
import { Receipt, Calendar, CreditCard, ChevronRight, X, Package } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface OrderCardProps {
  order: any; // Serialized order from Prisma
}

export function OrderCard({ order }: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col active:scale-[0.98] transition-transform text-left"
      >
        <div className="flex justify-between items-center w-full mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Receipt className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{order.invoiceNo}</h3>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Calendar className="size-3" />
                {new Date(order.createdAt).toLocaleString("id-ID", { 
                  dateStyle: "medium", 
                  timeStyle: "short" 
                })}
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-300" />
        </div>

        <div className="flex justify-between items-end w-full pt-3 border-t border-slate-50">
          <div>
            <span className="text-xs font-medium text-slate-500">{itemCount} item</span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                <CreditCard className="size-3" />
                {order.paymentType}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-500">Total</span>
            <p className="font-extrabold text-indigo-600 text-base">
              {formatRupiah(Number(order.totalAmount))}
            </p>
          </div>
        </div>
      </button>

      {/* Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="relative bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            
            {/* Handle for drag (visual only) */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-bold text-lg text-slate-800">Detail Transaksi</h2>
                <p className="text-xs font-medium text-slate-500">{order.invoiceNo}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors active:scale-95"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tanggal Waktu</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Metode Pembayaran</span>
                  <span className="font-bold text-indigo-600 uppercase">
                    {order.paymentType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    BERHASIL
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Package className="size-4" />
                Daftar Item
              </h4>
              
              <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm leading-tight mb-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} x {formatRupiah(Number(item.sellPrice))}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                      {formatRupiah(Number(item.subtotal))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white border-t border-slate-100 shrink-0">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900 text-sm">Total Belanja</span>
                <span className="font-black text-indigo-700 text-xl">
                  {formatRupiah(Number(order.totalAmount))}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
