import { auth, signOut } from "@/auth";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Store } from "lucide-react";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  const session = await auth();
  const user = session?.user;

  const store = await db.store.findUnique({
    where: { id: storeDbId }
  });

  return (
    <>
      <AdminHeader title="Profil Saya" />
      <div className="flex-1 p-4 bg-slate-50">
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="size-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <UserIcon className="size-8" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800">{user?.name}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="size-12 rounded-2xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
              <Store className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Toko Aktif</p>
              <h3 className="font-bold text-slate-800">{store?.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">
                {store?.address || "Belum ada alamat"}
              </p>
            </div>
          </div>

          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full h-12 rounded-xl font-bold gap-2 text-base"
            >
              <LogOut className="size-5" />
              Keluar Akun
            </Button>
          </form>
        </div>

      </div>
    </>
  );
}
