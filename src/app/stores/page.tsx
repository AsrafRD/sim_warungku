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
    where: {
      ownerId: session.user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
    },
  });

  if (stores.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF8F00] shadow-lg shadow-orange-500/20">
            <Store className="size-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pilih Toko
          </h1>

          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-slate-500">
            Pilih toko yang ingin Anda kelola.
          </p>
        </div>

        {/* Store List */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-[#FF8F00] hover:bg-orange-50/30 hover:shadow-md hover:shadow-orange-500/10 active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF8F00] transition-colors group-hover:bg-[#FF8F00] group-hover:text-white">
                    <Store className="size-6" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-800">
                      {store.name}
                    </h3>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {store.address || "WarungKu"}
                    </p>
                  </div>
                </div>

                <div className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 transition-all group-hover:bg-orange-100">
                  <ArrowRight className="size-4 text-slate-400 transition-colors group-hover:text-[#FF8F00]" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Add Store */}
        <Link
          href="/onboarding"
          className="mt-4 block w-full"
        >
          <Button
            variant="outline"
            className="h-14 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-transparent font-semibold text-slate-600 transition-all hover:border-[#FF8F00] hover:bg-orange-50 hover:text-[#FF8F00]"
          >
            <Plus className="mr-2 size-5" />
            Buka Cabang Baru
          </Button>
        </Link>

      </div>
    </div>
  );
}
