import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomerClient } from "./customer-client";
import { AdminHeader } from "@/components/modules/admin/admin-header";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const storeDbId = await validateStoreAccess(storeId);

  if (!storeDbId) {
    redirect("/");
  }

  const limit = 20;
  
  // 1. Fetch total piutang
  const totalPiutangResult = await db.customer.aggregate({
    where: { storeId: storeDbId },
    _sum: { debtBalance: true }
  });
  const totalPiutang = Number(totalPiutangResult._sum.debtBalance || 0);

  // 2. Fetch first page
  const customers = await db.customer.findMany({
    where: { storeId: storeDbId },
    include: {
      debtPayments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  const parsedCustomers = customers.map(c => ({
    ...c,
    debtBalance: Number(c.debtBalance),
    debtPayments: c.debtPayments.map(p => ({
      ...p,
      amount: Number(p.amount)
    }))
  }));

  return (
    <div className="bg-[#F5F5DC]/40">
      <AdminHeader title="Riwayat Pelanggan" />
      <div className="flex-1 space-y-4 p-4 lg:p-8 bg-slate-50">
        <CustomerClient 
          storeId={storeId} 
          initialCustomers={parsedCustomers} 
          totalPiutang={totalPiutang} 
        />
      </div>
    </div>
  );
}
