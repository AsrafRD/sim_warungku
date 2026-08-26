"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Loader2, X, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/store/use-cart";
import { createOrder } from "@/actions/pos.actions";
import { formatRupiah } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Product, Unit } from "@/generated/prisma/client";

type PosProduct = Product & { unit: { name: string } | null };

export function PosClient({ 
  storeId, 
  products 
}: { 
  storeId: string; 
  products: PosProduct[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const cart = useCart();
  const [isPending, startTransition] = useTransition();
  const [paymentType, setPaymentType] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [error, setError] = useState("");
  
  // Mobile Cart State
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Success Modal State
  const [successInvoice, setSuccessInvoice] = useState<string | null>(null);

  // Close cart when empty on mobile
  useEffect(() => {
    if (cart.items.length === 0 && isCartOpen) {
      setIsCartOpen(false);
    }
  }, [cart.items.length, isCartOpen]);

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
        setIsCartOpen(false); // Close cart modal
        setSuccessInvoice(result.data?.invoiceNo || "INV-SUCCESS");
        router.refresh(); // Refresh to update stocks on the server
      } else {
        setError(result.message || "Gagal memproses transaksi");
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden relative">
      {/* LEFT PANEL: PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col bg-slate-50 lg:border-r border-slate-200 overflow-y-auto pb-24 lg:pb-0">
        <div className="p-3 lg:p-4 bg-white border-b border-slate-200 sticky top-0 z-10 lg:static">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 lg:size-5 text-slate-400" />
            <Input 
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 lg:pl-10 h-10 lg:h-12 rounded-xl text-sm lg:text-base bg-slate-50"
            />
          </div>
        </div>
        <div className="p-3 lg:p-4 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3">
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
                  <span className="font-bold text-indigo-600 text-xs lg:text-sm">
                    {formatRupiah(Number(product.sellPrice))}
                    <span className="text-[9px] lg:text-[10px] text-slate-400 font-normal ml-0.5">/ {product.unit?.name || "PCS"}</span>
                  </span>
                  <span className={`text-[10px] lg:text-xs px-1.5 py-0.5 rounded-md font-medium ${
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

      {/* MOBILE FLOATING CART SUMMARY */}
      {cart.items.length > 0 && !isCartOpen && (
        <div className="lg:hidden absolute bottom-4 left-4 right-4 bg-indigo-600 text-white p-3 rounded-2xl flex items-center justify-between z-20 shadow-xl shadow-indigo-600/20 border border-indigo-500 animate-in slide-in-from-bottom-5">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-indigo-200">{cart.items.length} Barang Tersimpan</span>
            <span className="font-bold text-lg">{formatRupiah(total)}</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center gap-2"
          >
            <ShoppingCart className="size-4" />
            Bayar
          </button>
        </div>
      )}

      {/* RIGHT PANEL: CART (Desktop: Sidebar, Mobile: Fullscreen Modal) */}
      <div className={`
        absolute inset-0 z-40 bg-slate-50 flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:w-[400px] lg:shrink-0 lg:border-l lg:border-slate-200 lg:z-auto lg:translate-y-0
        ${isCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
      `}>
        <div className="p-3 lg:p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCartOpen(false)}
              className="lg:hidden p-1.5 mr-1 text-slate-500 hover:bg-slate-100 rounded-lg active:scale-95"
            >
              <X className="size-5" />
            </button>
            <h2 className="font-bold text-base lg:text-lg text-slate-800 flex items-center gap-2">
              <ShoppingCart className="size-4 lg:size-5 text-indigo-600" />
              Keranjang Kasir
            </h2>
          </div>
          {cart.items.length > 0 && (
            <button 
              onClick={() => {
                cart.clearCart();
                setIsCartOpen(false);
              }}
              className="text-[11px] lg:text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1.5 rounded-full transition-colors"
            >
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3">
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
                      {formatRupiah(Number(item.product.sellPrice))} <span className="text-[10px] text-slate-400">/ {item.product.unit?.name || "PCS"}</span>
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
        <div className="p-3 lg:p-4 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-medium text-slate-500 uppercase tracking-wider">Total Tagihan</span>
              <span className="text-xl lg:text-2xl font-black text-slate-900">{formatRupiah(total)}</span>
            </div>
          </div>

          {error && (
            <div className="mb-3 lg:mb-4 p-2 lg:p-2.5 bg-red-50 text-red-600 text-[11px] lg:text-xs font-medium rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2 lg:space-y-3">
            <Label className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">Metode Bayar</Label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPaymentType("CASH")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${paymentType === "CASH" ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <Banknote className="size-4 lg:size-5 mb-1" />
                <span className="text-[9px] lg:text-[10px] font-bold">CASH</span>
              </button>
              <button 
                onClick={() => setPaymentType("QRIS")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${paymentType === "QRIS" ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <QrCode className="size-4 lg:size-5 mb-1" />
                <span className="text-[9px] lg:text-[10px] font-bold">QRIS</span>
              </button>
              <button 
                onClick={() => setPaymentType("TRANSFER")}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${paymentType === "TRANSFER" ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <CreditCard className="size-4 lg:size-5 mb-1" />
                <span className="text-[9px] lg:text-[10px] font-bold">TRANSFER</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 mt-3 lg:mt-4">
            <Label className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">Nominal Bayar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">Rp</span>
              <Input 
                type="number" 
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="pl-9 h-11 lg:h-12 rounded-xl font-bold text-base lg:text-lg bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 mb-3 lg:mb-4 px-1">
            <span className="text-[11px] lg:text-sm font-medium text-slate-500">Kembalian</span>
            <span className={`font-bold text-sm lg:text-base ${change > 0 ? "text-emerald-600" : "text-slate-400"}`}>
              {formatRupiah(change)}
            </span>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={cart.items.length === 0 || isPending}
            className="w-full h-12 lg:h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base lg:text-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            {isPending ? <Loader2 className="size-5 lg:size-6 animate-spin" /> : "PROSES BAYAR"}
          </Button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {successInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="size-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">Transaksi Berhasil!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Pembayaran telah diterima dan stok produk telah diperbarui.
            </p>
            
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">No Invoice</p>
              <p className="font-bold text-slate-800 text-lg">{successInvoice}</p>
            </div>

            <button 
              onClick={() => setSuccessInvoice(null)}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
