import type { Metadata } from "next";
import { BottomNav } from "@/components/modules/admin/bottom-nav";
import { validateStoreAccess } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "WarungKu — Dashboard",
  description: "Sistem Informasi & POS Warung",
};

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { storeId } = await params;

  const hasAccess = await validateStoreAccess(storeId);
  if (!hasAccess) {
    redirect("/");
  }

  // Ambil status lisensi paket (apakah memiliki akses web combo atau mobile-only)
  const sub = await db.subscription.findUnique({
    where: { storeId: hasAccess },
  });
  const hasWebAccess = sub?.hasWebAccess ?? false;

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col bg-slate-50">
      {/* Main content area — strictly bounded to screen minus BottomNav (72px) on mobile */}
      <main className="h-[calc(100dvh-72px)] lg:h-[100dvh] flex flex-col overflow-y-auto w-full">
        {children}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav hasWebAccess={hasWebAccess} />
    </div>
  );
}
