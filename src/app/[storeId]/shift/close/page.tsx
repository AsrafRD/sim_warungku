import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CloseShiftClient } from "./close-shift-client";

export default async function CloseShiftPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const storeDbId = await validateStoreAccess(storeId);

  if (!storeDbId) {
    redirect("/");
  }

  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const shift = await db.shift.findFirst({
    where: {
      storeId: storeDbId,
      cashierId: session.user.id,
      status: "OPEN",
    },
    include: {
      orders: true,
    },
  });

  if (!shift) {
    redirect(`/${storeId}/pos`);
  }

  // Calculate expected balance
  const cashOrdersTotal = shift.orders
    .filter((o) => o.paymentType === "CASH")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const expectedBalance = Number(shift.openingBalance) + cashOrdersTotal;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-4">
        <CloseShiftClient
          storeId={storeId}
          shiftId={shift.id}
          openingBalance={Number(shift.openingBalance)}
          expectedBalance={expectedBalance}
          cashSales={cashOrdersTotal}
        />
      </div>
    </div>
  );
}
