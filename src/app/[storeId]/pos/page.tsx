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

  // Cek hak akses web POS
  const sub = await db.subscription.findUnique({
    where: { storeId: storeDbId },
  });

  if (!sub?.hasWebAccess) {
    redirect(`/${storeId}`);
  }

  const rawProducts = await db.product.findMany({
    where: {
      storeId: storeDbId,
    },
    include: {
      unit: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const products = rawProducts.map((p) => ({
    ...p,
    buyPrice: Number(p.buyPrice),
    sellPrice: Number(p.sellPrice),
  }));

  const { auth } = await import("@/auth");
  const session = await auth();

  let activeShift = null;
  if (session?.user?.id) {
    const shift = await db.shift.findFirst({
      where: {
        storeId: storeDbId,
        cashierId: session.user.id,
        status: "OPEN",
      },
    });

    if (shift) {
      activeShift = {
        ...shift,
        openingBalance: Number(shift.openingBalance),
        closingBalance: shift.closingBalance ? Number(shift.closingBalance) : null,
        expectedBalance: shift.expectedBalance ? Number(shift.expectedBalance) : null,
      };
    }
  }

  const customers = await db.customer.findMany({
    where: { storeId: storeDbId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#F5F5DC]/40">
      <PosClient
        storeId={storeId}
        products={products as any}
        activeShift={activeShift}
        customers={customers.map((c) => ({ ...c, debtBalance: Number(c.debtBalance) }))}
      />
    </div>
  );
}