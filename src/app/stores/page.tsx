import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StoresPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const stores = await db.store.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (stores.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20 mb-6">
            <Store className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pilih Toko
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-[280px] mx-auto">
            Anda memiliki akses ke beberapa toko. Silakan pilih toko yang ingin dibuka.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100 sm:p-6 mb-4">
          <div className="space-y-3">
            {stores.map((store) => (
              <Link 
                key={store.id} 
                href={`/${store.slug}/products`}
                className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-600/10 transition-all bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Store className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{store.name}</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[180px]">
                      {store.address || "Warung SaaS"}
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <Link href="/onboarding" className="block w-full">
          <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 bg-transparent hover:bg-slate-50">
            <Plus className="size-5 mr-2" />
            Buka Cabang Baru
          </Button>
        </Link>
        
      </div>
    </div>
  );
}
