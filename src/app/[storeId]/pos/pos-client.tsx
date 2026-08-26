"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Loader2 } from "lucide-react";
import { useCart } from "@/lib/store/use-cart";
import { createOrder } from "@/actions/pos.actions";
import { formatRupiah } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Product } from "@/generated/prisma/client";

export function PosClient({ 
  storeId, 
  products 
}: { 
  storeId: string; 
  products: Product[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const cart = useCart();
  const [isPending, startTransition] = useTransition();
  const [paymentType, setPaymentType] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [error, setError] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  const total = cart.getTotal();
  const change = Number(paidAmount) >= total ? Number(paidAmount) - total : 0;

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    if (Number(paidAmount) < total) {
      setError("Uang pembayaran kurang!");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createOrder(storeId, {
        paymentType,
        paidAmount: Number(paidAmount),
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          buyPrice: Number(item.product.buyPrice),
          sellPrice: Number(item.product.sellPrice),
        }))
      });

      if (result.success) {
        cart.clearCart();
        setPaidAmount("");
        alert(`Transaksi Berhasil!\nNo Invoice: ${result.data?.invoiceNo}`);
        router.refresh(); // Refresh to update stocks on the server
      } else {
        setError(result.message || "Gagal memproses transaksi");
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px-64px)] overflow-hidden">
      {/* LEFT PANEL: PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input 
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-xl text-base"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => cart.addItem(product)}
                disabled={product.currentStock <= 0}
                className={`flex flex-col text-left rounded-2xl border p-3 transition-all active:scale-95 ${
                  product.currentStock > 0 
                    ? "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer" 
                    : "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300">
                  <Image src="/next.svg" alt="placeholder" width={40} height={40} className="opacity-20" />
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight flex-1">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-end justify-between w-full">
                  <span className="font-bold text-indigo-600 text-sm">
                    {formatRupiah(Number(product.sellPrice))}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">/ {product.unit || "PCS"}</span>
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    product.currentStock <= product.minStockWarning 
                      ? "bg-red-100 text-red-600" 
                      : "bg-emerald-100 text-emerald-600"
                  }`}>
                    Stok: {product.currentStock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: CART */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <ShoppingCart className="size-5 text-indigo-600" />
            Keranjang Kasir
          </h2>
          {cart.items.length > 0 && (
            <button 
              onClick={() => cart.clearCart()}
              className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-full transition-colors"
            >
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <ShoppingCart className="size-12 opacity-20" />
              <p className="text-sm font-medium">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.product.id} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{item.product.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {formatRupiah(Number(item.product.sellPrice))} <span className="text-[10px] text-slate-400">/ {item.product.unit || "PCS"}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => cart.removeItem(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-1">
                    <button 
                      onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
                      className="size-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}
                      className="size-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(Number(item.product.sellPrice) * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CHECKOUT FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Total Tagihan</span>
              <span className="text-2xl font-bold text-slate-900">{formatRupiah(total)}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metode Bayar</Label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPaymentType("CASH")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${paymentType === "CASH" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <Banknote className="size-5 mb-1" />
                <span className="text-[10px] font-bold">CASH</span>
              </button>
              <button 
                onClick={() => setPaymentType("QRIS")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${paymentType === "QRIS" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <QrCode className="size-5 mb-1" />
                <span className="text-[10px] font-bold">QRIS</span>
              </button>
              <button 
                onClick={() => setPaymentType("TRANSFER")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${paymentType === "TRANSFER" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <CreditCard className="size-5 mb-1" />
                <span className="text-[10px] font-bold">TRF</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 mt-4">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nominal Bayar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">Rp</span>
              <Input 
                type="number" 
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="pl-9 h-12 rounded-xl font-bold text-lg bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 mb-4 px-1">
            <span className="text-sm font-medium text-slate-500">Kembalian</span>
            <span className={`font-bold ${change > 0 ? "text-emerald-600" : "text-slate-400"}`}>
              {formatRupiah(change)}
            </span>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={cart.items.length === 0 || isPending}
            className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            {isPending ? <Loader2 className="size-6 animate-spin" /> : "PROSES BAYAR"}
          </Button>
        </div>
      </div>
    </div>
  );
}
