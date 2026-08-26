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

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#F5F5DC]/40">
      <PosClient
        storeId={storeId}
        products={products}
      />
    </div>
  );
}