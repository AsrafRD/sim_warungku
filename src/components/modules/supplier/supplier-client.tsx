"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Building2, Phone, Mail, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  user: { email: string } | null;
  _count: { products: number };
}

export function SupplierClient({ storeId }: { storeId: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  // Login Account fields
  const [linkAccount, setLinkAccount] = useState(false);
  const [emailToLink, setEmailToLink] = useState("");

  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/suppliers?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data supplier", err);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/suppliers?storeId=${storeId}`);
        const data = await res.json();
        if (mounted && data.success) {
          setSuppliers(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [storeId]);

  const fetchSuppliersWrapper = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/suppliers?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload = {
        name,
        contactName: contactName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        linkAccount,
        emailToLink: linkAccount ? emailToLink : undefined,
      };

      const res = await fetch(`/api/suppliers?storeId=${storeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setIsAddModalOpen(false);
        resetForm();
        fetchSuppliersWrapper();
      } else {
        setError(data.message || "Gagal menambahkan supplier");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setContactName("");
    setPhone("");
    setAddress("");
    setLinkAccount(false);
    setEmailToLink("");
    setError(null);
  };

  if (isLoading) {
    return <div className="text-center p-8 font-bold text-black/50">Memuat data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-black">Daftar Supplier</h2>
          <p className="text-xs text-black/60">Kelola supplier untuk {suppliers.length} entitas</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm hover:scale-95 transition-transform"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 px-4 bg-black/5 rounded-2xl border border-black/10">
          <Building2 className="size-12 mx-auto mb-3 text-black/20" />
          <h3 className="font-bold text-black mb-1">Belum Ada Supplier</h3>
          <p className="text-xs text-black/60">Tambahkan supplier pertama Anda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="p-4 bg-white rounded-2xl border border-black/10 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5DC] text-[#FF8F00]">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black text-sm">{supplier.name}</h3>
                    <p className="text-xs text-black/60 line-clamp-1">{supplier.contactName || "Tanpa PIC"}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-3 pt-3 border-t border-black/5 text-xs text-black/60">
                <div className="flex items-center gap-1">
                  <Phone className="size-3 text-[#FF8F00]" />
                  <span>{supplier.phone || "-"}</span>
                </div>
                {supplier.user && (
                  <div className="flex items-center gap-1">
                    <Mail className="size-3 text-[#FF8F00]" />
                    <span>Terhubung (Akun)</span>
                  </div>
                )}
                <div className="ml-auto font-bold text-black">
                  {supplier._count.products} Item
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="w-[90vw] max-w-md bg-white border-0 rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-0 bg-white">
            <DialogTitle className="text-xl font-bold text-black">Tambah Supplier Baru</DialogTitle>
            <DialogDescription className="text-xs text-black/60">
              Masukkan detail supplier yang akan menyuplai barang.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSupplier} className="p-5 pt-4 flex flex-col gap-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-[#C62828]/10 text-[#C62828] text-xs font-bold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Input
                placeholder="Nama Perusahaan / Bisnis *"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12 bg-black/5 border-0 focus-visible:ring-[#FF8F00] rounded-xl font-medium"
                required
              />
              <Input
                placeholder="Nama PIC (Opsional)"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="h-12 bg-black/5 border-0 focus-visible:ring-[#FF8F00] rounded-xl font-medium"
              />
              <Input
                placeholder="Nomor Telepon (Opsional)"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-12 bg-black/5 border-0 focus-visible:ring-[#FF8F00] rounded-xl font-medium"
              />
            </div>

            <div className="bg-[#F5F5DC] p-4 rounded-2xl border border-[#FF8F00]/20 mt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 size-4 rounded-sm border-[#FF8F00] text-[#FF8F00] focus:ring-[#FF8F00]"
                  checked={linkAccount}
                  onChange={e => setLinkAccount(e.target.checked)}
                />
                <div>
                  <p className="font-bold text-sm text-black">Tautkan ke Akun Supplier Terdaftar</p>
                  <p className="text-[10px] text-black/60 mt-0.5 leading-snug">
                    Masukkan email supplier yang sudah mendaftar di sistem agar mereka bisa memantau stok.
                  </p>
                </div>
              </label>

              {linkAccount && (
                <div className="space-y-3 mt-4 pt-4 border-t border-black/10">
                  <Input
                    placeholder="Email akun supplier *"
                    type="email"
                    value={emailToLink}
                    onChange={e => setEmailToLink(e.target.value)}
                    className="h-10 text-sm bg-white border-0 focus-visible:ring-[#FF8F00] rounded-xl font-medium"
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!name || isSubmitting || (linkAccount && !emailToLink)}
              className="mt-4 h-14 w-full bg-[#FF8F00] text-white font-bold rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Supplier"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
