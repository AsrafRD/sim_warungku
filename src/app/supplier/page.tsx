import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { Store, ArrowRight, Package, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SupplierQuotaCard } from "@/components/modules/supplier/supplier-quota-card";
import { getMidtransConfig } from "@/lib/midtrans";

export default async function SupplierStoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [supplierProfiles, user] = await Promise.all([
    db.supplier.findMany({
      where: { userId: session.user.id },
      include: {
        store: true,
        _count: {
          select: { products: true }
        }
      }
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { supplierStoreQuota: true }
    })
  ]);

  const midtrans = getMidtransConfig();
  const quota = user?.supplierStoreQuota || 10;

  return (
    <div className="flex-1 p-6 pb-24 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Dashboard Supplier</h1>
          <p className="text-sm text-black/60 mt-1">
            Halo, {session.user.name}. Pilih toko untuk memantau stok.
          </p>
        </div>
        <Link 
          href="/api/auth/signout" 
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-[#C62828] hover:bg-[#C62828]/10 transition-colors"
        >
          <LogOut className="size-5" />
        </Link>
      </div>

      {/* Supplier Store Quota & Token Topup */}
      <SupplierQuotaCard
        linkedCount={supplierProfiles.length}
        quota={quota}
        clientKey={midtrans.clientKey}
        isProduction={midtrans.isProduction}
      />

      {supplierProfiles.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-[#FBC02D]/10 border border-dashed border-[#FF8F00]/30">
          <Package className="size-12 mx-auto mb-3 text-[#FF8F00] opacity-50" />
          <h3 className="font-bold text-black text-lg mb-1">Belum Terhubung</h3>
          <p className="text-sm text-black/60">
            Akun Anda belum ditautkan ke toko manapun. Minta pemilik toko untuk menambahkan Anda sebagai supplier.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/40 mb-3">
            Toko Mitra Anda ({supplierProfiles.length})
          </h2>
          
          <div className="grid gap-3">
            {supplierProfiles.map((profile) => (
              <Link 
                key={profile.id}
                href={`/supplier/${profile.store.slug}`}
                className="group relative flex flex-col p-4 rounded-2xl bg-white border border-black/10 shadow-sm hover:border-[#FF8F00] hover:shadow-md transition-all overflow-hidden"
              >
                {/* Decorative accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF8F00] group-hover:bg-[#FBC02D] transition-colors" />
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5DC] text-[#FF8F00]">
                      <Store className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black text-[15px]">{profile.store.name}</h3>
                      <p className="text-xs text-black/60 line-clamp-1">{profile.store.address || "Alamat tidak tersedia"}</p>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 group-hover:bg-[#FF8F00] group-hover:text-white text-black/40 transition-colors shrink-0">
                    <ArrowRight className="size-4" />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-black/5 mt-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Total Produk</p>
                    <p className="font-bold text-black text-sm">{profile._count.products} Item</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
