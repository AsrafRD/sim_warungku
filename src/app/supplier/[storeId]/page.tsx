import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { validateSupplierAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SupplierStorePageProps {
  params: Promise<{ storeId: string }>;
}

export default async function SupplierStorePage({ params }: SupplierStorePageProps) {
  const { storeId: storeSlug } = await params;
  
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // Validate they are a supplier for this store
  const storeId = await validateSupplierAccess(storeSlug);
  if (!storeId) redirect("/supplier");

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { name: true }
  });

  const supplier = await db.supplier.findFirst({
    where: { storeId, userId: session.user.id },
    select: { id: true }
  });

  if (!supplier) redirect("/supplier");

  // Fetch all products they supply to this store
  const products = await db.product.findMany({
    where: { 
      storeId, 
      supplierId: supplier.id 
    },
    include: {
      unit: true,
      category: true
    },
    orderBy: { currentStock: 'asc' } // Show low stock first
  });

  const lowStockCount = products.filter(p => p.currentStock <= p.minStockWarning).length;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 bg-[#FF8F00] text-white flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Link href="/supplier" className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight line-clamp-1">{store?.name}</h1>
            <p className="text-xs text-white/80 font-medium">Pemantauan Stok</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F5DC] border border-black/10 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-black/40 tracking-wider mb-1">Total Produk</p>
            <p className="text-2xl font-black text-black">{products.length}</p>
          </div>
          <div className={`border rounded-2xl p-4 shadow-sm ${lowStockCount > 0 ? 'bg-[#C62828]/10 border-[#C62828]/30' : 'bg-[#F5F5DC] border-black/10'}`}>
            <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${lowStockCount > 0 ? 'text-[#C62828]' : 'text-black/40'}`}>
              Stok Kritis
            </p>
            <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-[#C62828]' : 'text-black'}`}>
              {lowStockCount}
            </p>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-[#F5F5DC] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-black/5 bg-black/5">
            <h2 className="font-bold text-black">Daftar Produk Anda</h2>
          </div>
          
          <div className="divide-y divide-black/5">
            {products.length === 0 ? (
              <div className="p-8 text-center text-black/40">
                <Package className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada produk yang Anda suplai ke toko ini.</p>
              </div>
            ) : (
              products.map((product) => {
                const isLowStock = product.currentStock <= product.minStockWarning;
                
                return (
                  <div key={product.id} className="p-4 hover:bg-black/5 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-black text-sm">{product.name}</h3>
                        <p className="text-xs text-black/60 mt-0.5">
                          {product.sku || product.barcode || "Tanpa SKU"}
                        </p>
                      </div>
                      {isLowStock && (
                        <span className="flex items-center gap-1 bg-[#C62828] text-white text-[10px] font-bold px-2 py-1 rounded-md shrink-0">
                          <AlertCircle className="size-3" />
                          KRITIS
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 bg-black/5 px-2 py-1 rounded-md">
                          Batas Min: {product.minStockWarning}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-0.5">Sisa Stok</p>
                        <p className={`font-black text-lg leading-none ${isLowStock ? 'text-[#C62828]' : 'text-black'}`}>
                          {product.currentStock} <span className="text-xs font-bold text-black/40 ml-0.5">
                          {product.unit?.name || "PCS"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
