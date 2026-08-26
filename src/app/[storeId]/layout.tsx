import type { Metadata } from "next";
import { BottomNav } from "@/components/modules/admin/bottom-nav";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Warung SaaS — Dashboard",
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

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-xl overflow-hidden flex flex-col bg-slate-50">
      {/* Main content area — grows to fill available space */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  );
}
