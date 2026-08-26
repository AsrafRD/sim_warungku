import { Suspense } from "react";
import { SupplierClient } from "@/components/modules/supplier/supplier-client";
import { AdminHeader } from "@/components/modules/admin/admin-header";

interface SuppliersPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { storeId } = await params;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <AdminHeader title="Manajemen Supplier" />
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="animate-pulse text-[#FF8F00] font-bold">Memuat data...</span></div>}>
          <SupplierClient storeId={storeId} />
        </Suspense>
      </div>
    </div>
  );
}
