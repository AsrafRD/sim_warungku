import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PosClient } from "./pos-client";

export default async function PosPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) {
    redirect("/");
  }

  // Fetch all products for the catalog
  const rawProducts = await db.product.findMany({
    where: { storeId: storeDbId },
    orderBy: { name: "asc" }
  });

  // Serialize Decimal to number for Client Components
  const products = rawProducts.map(p => ({
    ...p,
    buyPrice: Number(p.buyPrice),
    sellPrice: Number(p.sellPrice),
  }));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-slate-900 text-white px-4 h-14 flex items-center justify-between shrink-0 shadow-md relative z-10">
        <h1 className="font-bold text-lg tracking-tight">Mode Kasir (POS)</h1>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-slate-300">Sistem Online</span>
        </div>
      </div>
      
      {/* @ts-expect-error - Decimal vs Number type mismatch, handled at runtime */}
      <PosClient storeId={storeId} products={products} />
    </div>
  );
}
