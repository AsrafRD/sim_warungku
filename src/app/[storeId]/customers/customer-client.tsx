"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Loader2 } from "lucide-react";
import { createCustomer, getUnpaidKasbonOrders, payDebtInvoices, getCustomersPaginated } from "@/actions/customer.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInView } from "react-intersection-observer";

interface CustomerClientProps {
  storeId: string;
  initialCustomers: any[];
  totalPiutang: number;
}

export function CustomerClient({ storeId, initialCustomers, totalPiutang }: CustomerClientProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { ref, inView } = useInView();
  
  const [isPending, startTransition] = useTransition();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAddress, setAddAddress] = useState("");

  const [payCustomer, setPayCustomer] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
  const [kasbonOrders, setKasbonOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Search Change
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoadingMore(true);
      const res = await getCustomersPaginated(storeId, 1, debouncedSearch, 20);
      if (mounted && res.success && res.data && res.meta) {
        setCustomers(res.data);
        setPage(1);
        setHasMore(res.meta.hasMore);
      }
      if (mounted) setIsLoadingMore(false);
    })();
    return () => { mounted = false };
  }, [debouncedSearch, storeId]);

  // Handle Infinite Scroll
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      const loadMore = async () => {
        setIsLoadingMore(true);
        const nextPage = page + 1;
        const res = await getCustomersPaginated(storeId, nextPage, debouncedSearch, 20);
        if (res.success && res.data && res.meta) {
          setCustomers(prev => [...prev, ...(res.data || [])]);
          setPage(nextPage);
          setHasMore(res.meta.hasMore);
        }
        setIsLoadingMore(false);
      };
      loadMore();
    }
  }, [inView, hasMore, isLoadingMore, page, debouncedSearch, storeId]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName) return;

    startTransition(async () => {
      const res = await createCustomer(storeId, { name: addName, phone: addPhone, address: addAddress });
      if (res.success) {
        setIsAddOpen(false);
        setAddName("");
        setAddPhone("");
        setAddAddress("");
      }
    });
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomer || selectedOrders.length === 0) return;

    startTransition(async () => {
      const res = await payDebtInvoices(payCustomer.id, selectedOrders, paymentType);
      if (res.success) {
        setPayCustomer(null);
        setSelectedOrders([]);
        setKasbonOrders([]);
      }
    });
  };

  const handleOpenPayment = (c: any) => {
    if (c.debtBalance <= 0) return;
    setPayCustomer(c);
    setKasbonOrders([]);
    setSelectedOrders([]);
    setIsLoadingOrders(true);
    getUnpaidKasbonOrders(c.id).then(res => {
      if (res.success && res.data) {
        setKasbonOrders(res.data);
      }
      setIsLoadingOrders(false);
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(kasbonOrders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const selectedTotal = kasbonOrders
    .filter(o => selectedOrders.includes(o.id))
    .reduce((sum, o) => sum + o.remainingAmount, 0);

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-sm font-medium text-slate-500">Total Piutang (Belum Dibayar)</span>
          <span className="text-3xl font-black text-[#C62828] mt-2">{formatRupiah(totalPiutang)}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl max-w-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Pelanggan</th>
                <th className="px-6 py-4 font-medium">Telepon</th>
                <th className="px-6 py-4 font-medium text-right">Total Utang (Kasbon)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada pelanggan.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr 
                    key={c.id} 
                    className={`transition-colors ${c.debtBalance > 0 ? 'hover:bg-slate-50/50 cursor-pointer' : 'opacity-80'}`}
                    onClick={() => handleOpenPayment(c)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                    <td className="px-6 py-4 text-slate-600">{c.phone || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${c.debtBalance > 0 ? 'text-[#C62828]' : 'text-emerald-600'}`}>
                        {formatRupiah(c.debtBalance)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {hasMore && (
                <tr ref={ref}>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <Loader2 className="size-5 animate-spin mx-auto text-[#FF8F00]" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4 mt-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input required value={addName} onChange={e => setAddName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>No. WhatsApp (Opsional)</Label>
              <Input type="tel" value={addPhone} onChange={e => setAddPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Alamat (Opsional)</Label>
              <Input value={addAddress} onChange={e => setAddAddress(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#FF8F00] hover:bg-[#e68100]">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan Pelanggan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Debt Modal */}
      <Dialog open={!!payCustomer} onOpenChange={(open) => !open && setPayCustomer(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Bayar Tagihan Kasbon</DialogTitle>
          </DialogHeader>
          {payCustomer && (
            <form onSubmit={handlePayDebt} className="space-y-4 mt-2">
              <div className="p-3 bg-red-50 text-red-800 rounded-xl mb-2 border border-red-100 flex justify-between items-center">
                <span className="text-sm font-medium">Sisa Utang {payCustomer.name}:</span>
                <span className="text-lg font-black">{formatRupiah(payCustomer.debtBalance)}</span>
              </div>

              {isLoadingOrders ? (
                <div className="py-8 flex justify-center text-slate-400">
                  <Loader2 className="animate-spin size-6" />
                </div>
              ) : kasbonOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Tidak ada transaksi kasbon yang belum lunas.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <input 
                      type="checkbox" 
                      id="selectAll"
                      checked={selectedOrders.length === kasbonOrders.length && kasbonOrders.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-[#FF8F00] focus:ring-[#FF8F00] size-4 cursor-pointer"
                    />
                    <Label htmlFor="selectAll" className="text-sm font-bold cursor-pointer">Pilih Semua Tagihan</Label>
                  </div>
                  
                  {kasbonOrders.map((order) => (
                    <div key={order.id} className={`flex items-center gap-3 p-3 rounded-xl border ${selectedOrders.includes(order.id) ? 'border-[#FF8F00] bg-[#FFF8D9]' : 'border-slate-200 bg-white'}`}>
                      <input
                        type="checkbox"
                        id={order.id}
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                        className="rounded border-slate-300 text-[#FF8F00] focus:ring-[#FF8F00] size-4 mt-0.5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <Label htmlFor={order.id} className="text-sm font-bold block cursor-pointer">{order.invoiceNo || "Invoice"}</Label>
                        <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-black text-[#C62828]">{formatRupiah(order.remainingAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center mb-3">
                  <Label>Total yang akan dibayar:</Label>
                  <span className="text-xl font-black text-emerald-600">{formatRupiah(selectedTotal)}</span>
                </div>
                
                <div>
                  <Label>Metode Pembayaran</Label>
                  <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tunai (CASH)</SelectItem>
                      <SelectItem value="QRIS">QRIS</SelectItem>
                      <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={isPending || selectedOrders.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11">
                {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                Konfirmasi Pembayaran
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =====================================================
          FAB
      ===================================================== */}
      <button
        onClick={() => setIsAddOpen(true)}
        aria-label="Tambah pelanggan"
        className="
          fixed
          bottom-25 right-4
          z-50
          flex size-14
          items-center justify-center
          rounded-full
          bg-[#FF8F00]
          text-white
          shadow-lg shadow-orange-500/30
          transition-transform hover:scale-105 active:scale-95
        "
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
