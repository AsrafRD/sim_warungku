"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { useCart } from "@/lib/store/use-cart";
import { createOrder } from "@/actions/pos.actions";
import { formatRupiah } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { Product } from "@/generated/prisma/client";

type PosProduct = Omit<Product, "buyPrice" | "sellPrice"> & {
  buyPrice: number | any;
  sellPrice: number | any;
  unit: {
    name: string;
  } | null;
};

export function PosClient({
  storeId,
  products,
}: {
  storeId: string;
  products: PosProduct[];
}) {
  const router = useRouter();
  const cart = useCart();

  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const [paymentType, setPaymentType] = useState<
    "CASH" | "QRIS" | "TRANSFER"
  >("CASH");

  const [paidAmount, setPaidAmount] = useState("");
  const [error, setError] = useState("");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (cart.items.length === 0 && isCartOpen) {
      setIsCartOpen(false);
    }
  }, [cart.items.length, isCartOpen]);

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(keyword) ||
      (product.barcode && product.barcode.includes(search))
    );
  });

  const total = cart.getTotal();

  const change =
    Number(paidAmount) >= total
      ? Number(paidAmount) - total
      : 0;

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
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          buyPrice: Number(item.product.buyPrice),
          sellPrice: Number(item.product.sellPrice),
        })),
      });

      if (result.success) {
        cart.clearCart();
        setPaidAmount("");
        setIsCartOpen(false);

        setSuccessInvoice(
          result.data?.invoiceNo || "INV-SUCCESS"
        );

        router.refresh();
      } else {
        setError(
          result.message || "Gagal memproses transaksi"
        );
      }
    });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden lg:flex-row">

      {/* =====================================================
          PRODUCT CATALOG
      ===================================================== */}
      <div className="flex-1 overflow-y-auto bg-[#F5F5DC]/40 pb-24 lg:border-r lg:border-[#E8DFB5] lg:pb-0">

        {/* Search */}
        <div className="sticky top-0 z-10 border-b border-[#E8DFB5] bg-white/95 p-3 backdrop-blur lg:static lg:p-4">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 lg:size-5" />

            <Input
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border-[#E8DFB5] bg-[#F5F5DC]/50 pl-9 text-sm placeholder:text-slate-400 focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20 lg:h-12 lg:pl-10 lg:text-base"
            />
          </div>
        </div>

        {/* Catalog */}
        <div className="p-3 lg:p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8DFB5] bg-white py-16 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#F5F5DC] text-[#C8B96B]">
                <Search className="size-6" />
              </div>

              <p className="font-bold text-slate-700">
                Produk tidak ditemukan
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Coba gunakan nama atau barcode lain
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-3">

              {filteredProducts.map((product) => {
                const isOutOfStock =
                  product.currentStock <= 0;

                const isLowStock =
                  product.currentStock <=
                  product.minStockWarning;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => cart.addItem(product)}
                    disabled={isOutOfStock}
                    className={`group flex flex-col rounded-2xl border p-2.5 text-left transition-all lg:p-3 ${
                      isOutOfStock
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                        : "cursor-pointer border-[#E8DFB5] bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#FBC02D] hover:shadow-md active:scale-[0.98]"
                    }`}
                  >

                    {/* Product Image */}
                    <div
                      className={`relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl ${
                        isOutOfStock
                          ? "bg-slate-200"
                          : "bg-[#F5F5DC]"
                      }`}
                    >
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className={`object-cover ${
                            isOutOfStock
                              ? "grayscale opacity-60"
                              : ""
                          }`}
                        />
                      ) : (
                        <Image
                          src="/next.svg"
                          alt=""
                          width={40}
                          height={40}
                          className={`opacity-20 ${
                            isOutOfStock
                              ? "grayscale"
                              : ""
                          }`}
                        />
                      )}

                      {isOutOfStock && (
                        <span className="absolute rounded-full bg-[#C62828] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                          Habis
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-tight text-slate-800">
                      {product.name}
                    </h3>

                    {/* Price / Stock */}
                    <div className="mt-2 flex w-full items-end justify-between gap-2">

                      <div className="min-w-0">
                        <span className="block truncate text-xs font-black text-[#FF8F00] lg:text-sm">
                          {formatRupiah(
                            Number(product.sellPrice)
                          )}
                        </span>

                        <span className="text-[9px] text-slate-400 lg:text-[10px]">
                          / {product.unit?.name || "PCS"}
                        </span>
                      </div>

                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold lg:text-[10px] ${
                          isLowStock
                            ? "bg-red-50 text-[#C62828]"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {product.currentStock}
                      </span>
                    </div>

                  </button>
                );
              })}

            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          MOBILE CART SUMMARY
      ===================================================== */}
      {cart.items.length > 0 && !isCartOpen && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-2xl border border-[#FF8F00] bg-[#FF8F00] p-3 text-white shadow-xl shadow-orange-500/20 lg:hidden">

          <div className="flex flex-col">
            <span className="text-xs font-medium text-orange-100">
              {cart.items.length} Barang
            </span>

            <span className="text-lg font-black">
              {formatRupiah(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#FF8F00] shadow-sm transition-transform active:scale-95"
          >
            <ShoppingCart className="size-4" />
            Bayar
          </button>
        </div>
      )}

      {/* =====================================================
          CART
      ===================================================== */}
      <div
        className={`
          absolute inset-0 z-40 flex flex-col bg-white transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:w-[400px] lg:shrink-0 lg:border-l lg:border-[#E8DFB5] lg:translate-y-0
          ${
            isCartOpen
              ? "translate-y-0"
              : "translate-y-full lg:translate-y-0"
          }
        `}
      >

        {/* Cart Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFB5] bg-white p-3 lg:p-4">

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="mr-1 rounded-lg p-1.5 text-slate-500 hover:bg-[#F5F5DC] lg:hidden"
            >
              <X className="size-5" />
            </button>

            <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFF0D6] text-[#FF8F00]">
              <ShoppingCart className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800 lg:text-base">
                Keranjang
              </h2>

              <p className="text-[10px] text-slate-400">
                {cart.items.length} produk dipilih
              </p>
            </div>
          </div>

          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                cart.clearCart();
                setIsCartOpen(false);
              }}
              className="rounded-full bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-[#C62828] transition-colors hover:bg-red-100"
            >
              Kosongkan
            </button>
          )}

        </div>

        {/* Cart Items */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3 lg:p-4">

          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">

              <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-[#F5F5DC] text-[#C8B96B]">
                <ShoppingCart className="size-7" />
              </div>

              <p className="text-sm font-bold text-slate-600">
                Keranjang kosong
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pilih produk untuk memulai transaksi
              </p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.product.id}
                className="rounded-xl border border-[#E8DFB5] bg-[#F5F5DC]/40 p-3"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-1 text-sm font-bold text-slate-800">
                      {item.product.name}
                    </h4>

                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {formatRupiah(
                        Number(item.product.sellPrice)
                      )}

                      <span className="ml-1 text-[10px] text-slate-400">
                        / {item.product.unit?.name || "PCS"}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      cart.removeItem(item.product.id)
                    }
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-[#C62828]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">

                  {/* Quantity */}
                  <div className="flex items-center gap-2 rounded-lg border border-[#E8DFB5] bg-white p-1">

                    <button
                      type="button"
                      onClick={() =>
                        cart.updateQuantity(
                          item.product.id,
                          item.quantity - 1
                        )
                      }
                      className="flex size-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[#F5F5DC] hover:text-[#FF8F00]"
                    >
                      <Minus className="size-3.5" />
                    </button>

                    <span className="w-5 text-center text-sm font-bold text-slate-800">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        cart.updateQuantity(
                          item.product.id,
                          item.quantity + 1
                        )
                      }
                      className="flex size-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[#F5F5DC] hover:text-[#FF8F00]"
                    >
                      <Plus className="size-3.5" />
                    </button>

                  </div>

                  <span className="font-black text-slate-800">
                    {formatRupiah(
                      Number(item.product.sellPrice) *
                        item.quantity
                    )}
                  </span>

                </div>
              </div>
            ))
          )}

        </div>

        {/* =====================================================
            CHECKOUT
        ===================================================== */}
        <div className="shrink-0 border-t border-[#E8DFB5] bg-white p-3 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] lg:p-4">

          {/* Total */}
          <div className="mb-3 flex items-end justify-between lg:mb-4">

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Tagihan
              </span>

              <p className="mt-0.5 text-xs text-slate-400">
                {cart.items.length} jenis produk
              </p>
            </div>

            <span className="text-xl font-black text-[#FF8F00] lg:text-2xl">
              {formatRupiah(total)}
            </span>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50 p-2.5 text-xs font-semibold text-[#C62828]">
              {error}
            </div>
          )}

          {/* Payment */}
          <div className="space-y-2">

            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Metode Pembayaran
            </Label>

            <div className="grid grid-cols-3 gap-2">

              <PaymentButton
                active={paymentType === "CASH"}
                onClick={() => setPaymentType("CASH")}
                icon={Banknote}
                label="CASH"
              />

              <PaymentButton
                active={paymentType === "QRIS"}
                onClick={() => setPaymentType("QRIS")}
                icon={QrCode}
                label="QRIS"
              />

              <PaymentButton
                active={paymentType === "TRANSFER"}
                onClick={() => setPaymentType("TRANSFER")}
                icon={CreditCard}
                label="TRANSFER"
              />

            </div>
          </div>

          {/* Paid Amount */}
          <div className="mt-3 space-y-1.5">

            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nominal Bayar
            </Label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                Rp
              </span>

              <Input
                type="number"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  setError("");
                }}
                className="h-12 rounded-xl border-[#E8DFB5] bg-[#F5F5DC]/40 pl-9 text-lg font-black focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
              />
            </div>
          </div>

          {/* Change */}
          <div className="mb-3 mt-2 flex items-center justify-between px-1 lg:mb-4">

            <span className="text-xs font-medium text-slate-500">
              Kembalian
            </span>

            <span
              className={`text-sm font-black ${
                change > 0
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              {formatRupiah(change)}
            </span>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={
              cart.items.length === 0 || isPending
            }
            className="h-12 w-full rounded-xl bg-[#FF8F00] text-base font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#E98200] active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none lg:h-14 lg:text-lg"
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin lg:size-6" />
            ) : (
              <>
                PROSES BAYAR
                <span className="ml-2 opacity-70">
                  →
                </span>
              </>
            )}
          </Button>

        </div>
      </div>

      {/* =====================================================
          SUCCESS MODAL
      ===================================================== */}
      {successInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">

          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-300 lg:p-8">

            {/* Success Icon */}
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="size-10" />
            </div>

            <h2 className="text-2xl font-black text-slate-800">
              Transaksi Berhasil!
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Pembayaran telah diterima dan stok produk telah diperbarui.
            </p>

            {/* Invoice */}
            <div className="mt-6 rounded-2xl border border-[#E8DFB5] bg-[#F5F5DC]/50 p-4">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nomor Invoice
              </p>

              <p className="mt-1 text-lg font-black text-[#FF8F00]">
                {successInvoice}
              </p>

            </div>

            {/* New Transaction */}
            <button
              type="button"
              onClick={() =>
                setSuccessInvoice(null)
              }
              className="mt-6 h-12 w-full rounded-xl bg-[#FF8F00] text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#E98200] active:scale-95"
            >
              Transaksi Baru
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PAYMENT BUTTON
============================================================ */

function PaymentButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 transition-all ${
        active
          ? "border-[#FF8F00] bg-[#FFF0D6] text-[#FF8F00] shadow-sm"
          : "border-[#E8DFB5] bg-white text-slate-500 hover:border-[#FBC02D] hover:bg-[#F5F5DC]/40"
      }`}
    >
      <Icon className="mb-1 size-4 lg:size-5" />

      <span className="text-[9px] font-black lg:text-[10px]">
        {label}
      </span>
    </button>
  );
}
