"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  CreditCard,
  Banknote,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrialProduct {
  id: string;
  name: string;
  category: string;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

interface CartItem {
  product: TrialProduct;
  quantity: number;
}

interface TrialOrder {
  invoiceNo: string;
  items: { name: string; quantity: number; price: number; subtotal: number }[];
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentType: string;
  createdAt: string;
}

const DEFAULT_PRODUCTS: TrialProduct[] = [
  {
    id: "p1",
    name: "Mie Goreng Spesial",
    category: "Makanan",
    barcode: "8992345001",
    buyPrice: 2800,
    sellPrice: 3500,
    stock: 45,
  },
  {
    id: "p2",
    name: "Kopi Sachet Mantap",
    category: "Minuman",
    barcode: "8992345002",
    buyPrice: 1500,
    sellPrice: 2000,
    stock: 60,
  },
  {
    id: "p3",
    name: "Minyak Goreng 2L",
    category: "Sembako",
    barcode: "8992345003",
    buyPrice: 32000,
    sellPrice: 36000,
    stock: 18,
  },
  {
    id: "p4",
    name: "Beras Ramos 5kg",
    category: "Sembako",
    barcode: "8992345004",
    buyPrice: 65000,
    sellPrice: 72000,
    stock: 12,
  },
  {
    id: "p5",
    name: "Telur Ayam 1kg",
    category: "Sembako",
    barcode: "8992345005",
    buyPrice: 26000,
    sellPrice: 29000,
    stock: 25,
  },
  {
    id: "p6",
    name: "Teh Kotak Melati 200ml",
    category: "Minuman",
    barcode: "8992345006",
    buyPrice: 3200,
    sellPrice: 4500,
    stock: 30,
  },
  {
    id: "p7",
    name: "Biskuit Cokelat Roma",
    category: "Makanan",
    barcode: "8992345007",
    buyPrice: 7500,
    sellPrice: 9500,
    stock: 20,
  },
  {
    id: "p8",
    name: "Air Mineral Botol 600ml",
    category: "Minuman",
    barcode: "8992345008",
    buyPrice: 2200,
    sellPrice: 3500,
    stock: 50,
  },
];

let trialInvoiceCounter = 100000;
function getNextTrialInvoiceNo(): string {
  trialInvoiceCounter += 1;
  return `INV-TRIAL-${trialInvoiceCounter}`;
}

export default function TrialSandboxPage() {
  const [products, setProducts] = useState<TrialProduct[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("warungku_trial_products");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"CASH" | "QRIS">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [completedOrder, setCompletedOrder] = useState<TrialOrder | null>(null);

  const saveProductsToLocal = (newProducts: TrialProduct[]) => {
    setProducts(newProducts);
    localStorage.setItem("warungku_trial_products", JSON.stringify(newProducts));
  };

  const handleResetData = () => {
    if (confirm("Reset ulang data produk demo ke kondisi awal?")) {
      saveProductsToLocal(DEFAULT_PRODUCTS);
      setCart([]);
      setCompletedOrder(null);
    }
  };

  // Cart Management
  const addToCart = (product: TrialProduct) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock) return item;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.sellPrice * item.quantity,
    0
  );
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const changeAmount = paidAmount >= totalAmount ? paidAmount - totalAmount : 0;

  const categories = ["Semua", "Sembako", "Makanan", "Minuman"];

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === "Semua" || p.category === activeCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    return matchCat && matchSearch;
  });

  // Handle Complete Sale
  const handleCompleteSale = () => {
    if (paymentType === "CASH" && paidAmount < totalAmount) {
      alert("Nominal pembayaran kurang!");
      return;
    }

    const effectivePaid = paymentType === "QRIS" ? totalAmount : paidAmount;
    const invoiceNo = getNextTrialInvoiceNo();

    // 1. Potong stok lokal di LocalStorage
    const updatedProducts = products.map((p) => {
      const inCart = cart.find((c) => c.product.id === p.id);
      if (inCart) {
        return { ...p, stock: Math.max(0, p.stock - inCart.quantity) };
      }
      return p;
    });
    saveProductsToLocal(updatedProducts);

    // 2. Buat Order Record di lokal
    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const orderData: TrialOrder = {
      invoiceNo,
      items: cart.map((c) => ({
        name: c.product.name,
        quantity: c.quantity,
        price: c.product.sellPrice,
        subtotal: c.product.sellPrice * c.quantity,
      })),
      totalAmount,
      paidAmount: effectivePaid,
      changeAmount: paymentType === "QRIS" ? 0 : effectivePaid - totalAmount,
      paymentType,
      createdAt: timeFormatted,
    };

    // Simpan riwayat transaksi trial
    const existingOrders = JSON.parse(localStorage.getItem("warungku_trial_orders") || "[]");
    localStorage.setItem(
      "warungku_trial_orders",
      JSON.stringify([orderData, ...existingOrders])
    );

    setCompletedOrder(orderData);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-xl overflow-hidden flex flex-col bg-slate-50">
      {/* Top Marketing Sticky Banner */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-[#FF8F00] to-[#FBC02D] px-3.5 py-2 text-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 animate-pulse shrink-0" />
          <span className="text-[11px] font-bold leading-tight line-clamp-1">
            Mode Trial 100% Lokal (Tanpa Database Cloud)
          </span>
        </div>
        <Link
          href="/register"
          className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-slate-800 transition-colors"
        >
          Daftar Resmi
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#FF8F00]/10 text-[#FF8F00]">
            <Store className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">WarungKu Demo</h1>
            <p className="text-[11px] text-slate-500">Kasir Sandbox Offline</p>
          </div>
        </div>

        <button
          onClick={handleResetData}
          title="Reset Data Demo"
          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </header>

      {/* Search & Category Filter */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari produk demo atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl bg-slate-50 pl-9 text-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const inCart = cart.find((c) => c.product.id === p.id);
            const isOutOfStock = p.stock <= 0;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200 shadow-sm"
              >
                <div className="flex-1 pr-2">
                  <span className="text-[10px] font-bold text-[#FF8F00] uppercase tracking-wider">
                    {p.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-extrabold text-slate-800">
                      Rp {p.sellPrice.toLocaleString("id-ID")}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        isOutOfStock ? "text-red-500 font-bold" : "text-slate-400"
                      }`}
                    >
                      Stok: {p.stock}
                    </span>
                  </div>
                </div>

                <div>
                  {inCart ? (
                    <div className="flex items-center gap-1.5 bg-orange-50 rounded-xl p-1 border border-[#FF8F00]/30">
                      <button
                        onClick={() => updateCartQty(p.id, -1)}
                        className="flex size-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs active:scale-95"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-900">
                        {inCart.quantity}
                      </span>
                      <button
                        disabled={inCart.quantity >= p.stock}
                        onClick={() => updateCartQty(p.id, 1)}
                        className="flex size-7 items-center justify-center rounded-lg bg-[#FF8F00] text-white shadow-xs active:scale-95 disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      className="h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 shadow-xs"
                    >
                      <Plus className="mr-1 size-3.5" />
                      Tambah
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary Floating Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total ({totalItemsCount} Item)
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                Rp {totalAmount.toLocaleString("id-ID")}
              </p>
            </div>

            <Button
              onClick={() => {
                setPaidAmount(totalAmount);
                setIsCheckoutOpen(true);
              }}
              className="h-11 rounded-xl bg-[#FF8F00] hover:bg-[#e68100] text-white font-bold px-6 shadow-md shadow-orange-500/20"
            >
              Bayar Kasir
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Simulasi Pembayaran</h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="size-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Total Tagihan */}
            <div className="my-4 text-center p-3 rounded-2xl bg-orange-50/60 border border-[#FF8F00]/20">
              <span className="text-xs text-slate-500">Total Tagihan</span>
              <p className="text-2xl font-black text-slate-900">
                Rp {totalAmount.toLocaleString("id-ID")}
              </p>
            </div>

            {/* Metode Pembayaran */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPaymentType("CASH")}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 font-bold text-xs transition-all ${
                  paymentType === "CASH"
                    ? "border-[#FF8F00] bg-orange-50 text-[#FF8F00]"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <Banknote className="size-4" />
                Tunai
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType("QRIS");
                  setPaidAmount(totalAmount);
                }}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 font-bold text-xs transition-all ${
                  paymentType === "QRIS"
                    ? "border-[#FF8F00] bg-orange-50 text-[#FF8F00]"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <CreditCard className="size-4" />
                QRIS Demo
              </button>
            </div>

            {/* Input Tunai & Kembalian */}
            {paymentType === "CASH" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Uang Diterima</label>
                  <Input
                    type="number"
                    value={paidAmount || ""}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="h-11 rounded-xl text-base font-bold"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[totalAmount, 20000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaidAmount(amt)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                    >
                      {amt === totalAmount ? "Uang Pas" : `Rp ${(amt / 1000).toFixed(0)}k`}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500">Kembalian:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    Rp {changeAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleCompleteSale}
              disabled={paymentType === "CASH" && paidAmount < totalAmount}
              className="w-full h-12 rounded-xl bg-[#FF8F00] hover:bg-[#e68100] text-white font-bold shadow-md shadow-orange-500/20"
            >
              Selesaikan Transaksi
            </Button>
          </div>
        </div>
      )}

      {/* Struk Kasir Dialog Preview */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-center mb-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-7" />
              </div>
            </div>

            <h3 className="text-center text-base font-extrabold text-slate-900">
              Transaksi Demo Berhasil!
            </h3>
            <p className="text-center text-xs text-slate-500 mb-4">
              Stok produk lokal telah terpotong otomatis di browser.
            </p>

            {/* Thermal Receipt Paper Card */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 font-mono text-[11px] text-slate-700 space-y-2">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-bold uppercase text-xs">WARUNGKU DEMO</p>
                <p className="text-[10px] text-slate-400">Mode Sandbox Lokal 100%</p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {completedOrder.invoiceNo} • {completedOrder.createdAt}
                </p>
              </div>

              <div className="space-y-1.5 py-1">
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="line-clamp-1 flex-1">
                      {it.name} x{it.quantity}
                    </span>
                    <span className="font-bold">Rp {it.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL</span>
                  <span>Rp {completedOrder.totalAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>BAYAR ({completedOrder.paymentType})</span>
                  <span>Rp {completedOrder.paidAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>KEMBALIAN</span>
                  <span>Rp {completedOrder.changeAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <p className="text-center text-[9px] text-slate-400 pt-1">
                Terima kasih atas kunjungan Anda!
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <Button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Transaksi Baru
              </Button>

              <Link
                href="/register"
                className="flex items-center justify-center w-full h-11 rounded-xl bg-gradient-to-r from-[#FF8F00] to-[#FBC02D] text-white font-bold text-xs shadow-sm hover:opacity-95"
              >
                Gunakan WarungKu untuk Tokomu
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
