import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "SUPPLIER") {
    redirect("/");
  }

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col bg-[#F5F5DC]">
      <main className="flex-1 flex flex-col overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
