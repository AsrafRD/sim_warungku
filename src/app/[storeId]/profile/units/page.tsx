import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { UnitClient } from "./unit-client";

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  // Fetch units with product count
  const units = await db.unit.findMany({
    where: { storeId: storeDbId },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto">
      <AdminHeader title="Satuan Produk" showBack />
      <UnitClient storeId={storeId} units={units} />
    </div>
  );
}
