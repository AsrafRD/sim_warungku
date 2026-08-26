import { auth, signOut } from "@/auth";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  Settings2,
  Store,
  Tags,
  User as UserIcon,
  Warehouse,
} from "lucide-react";

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
    where: { id: storeDbId },
  });

  return (
    <div className="min-h-full bg-[#F5F5DC]/40">
      <AdminHeader title="Profil Saya" />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ================= PROFILE ================= */}
        <section className="overflow-hidden rounded-2xl border border-[#F5F5DC] bg-white shadow-sm">

          {/* Warm gradient */}
          <div className="h-24 bg-gradient-to-r from-[#FBC02D] via-[#FFB000] to-[#FF8F00]" />

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex items-end gap-4">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#F5F5DC] text-[#FF8F00] shadow-md">
                  <UserIcon
                    className="size-9"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="pb-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {user?.name || "Pengguna"}
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border border-[#FBC02D]/30 bg-[#FBC02D]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C27800]">
                {user?.role || "USER"}
              </span>
            </div>
          </div>
        </section>

        {/* ================= ACTIVE STORE ================= */}
        <section className="mt-5 rounded-2xl border border-[#F5F5DC] bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Toko Aktif
              </p>

              <h3 className="mt-1 text-base font-bold text-slate-900">
                Informasi toko yang sedang digunakan
              </h3>
            </div>

            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF3D0] text-[#FF8F00]">
              <Store className="size-5" />
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-[#F5F5DC] bg-[#F5F5DC]/50 p-4">

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#FF8F00] shadow-sm ring-1 ring-[#F5F5DC]">
              <Building2 className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">
                {store?.name || "Nama toko belum tersedia"}
              </p>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="size-3.5 shrink-0 text-[#FF8F00]" />

                <span className="truncate">
                  {store?.address || "Belum ada alamat"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SETTINGS ================= */}
        <section className="mt-5 rounded-2xl border border-[#F5F5DC] bg-white shadow-sm">

          <div className="border-b border-[#F5F5DC] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-xl bg-[#F5F5DC] text-[#FF8F00]">
                <Settings2 className="size-5" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Pengaturan Toko
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Kelola data dan konfigurasi toko
                </p>
              </div>

            </div>
          </div>

          <div className="divide-y divide-[#F5F5DC]">

            <ProfileMenuItem
              href={`/${storeId}/suppliers`}
              icon={Warehouse}
              title="Manajemen Supplier"
              description="Kelola data supplier dan pemasok"
              iconClassName="bg-[#FFF0D6] text-[#FF8F00]"
            />

            <ProfileMenuItem
              href={`/${storeId}/profile/categories`}
              icon={Tags}
              title="Kategori Produk"
              description="Atur kategori untuk produk toko"
              iconClassName="bg-[#FFF8D6] text-[#D99B00]"
            />

            <ProfileMenuItem
              href={`/${storeId}/profile/units`}
              icon={Package}
              title="Satuan Produk"
              description="Kelola satuan atau unit produk"
              iconClassName="bg-[#FFF0D6] text-[#FF8F00]"
            />

            <ProfileMenuItem
              href="/stores"
              icon={Store}
              title="Ganti Toko"
              description="Beralih ke toko lain yang tersedia"
              iconClassName="bg-[#F5F5DC] text-[#C27800]"
            />

          </div>
        </section>

        {/* ================= NEW BRANCH ================= */}
        <Link
          href="/onboarding"
          className="group mt-5 flex items-center gap-4 rounded-2xl border border-[#FBC02D]/40 bg-[#FFFBEA] p-5 transition-all hover:border-[#FBC02D] hover:bg-[#FFF8D6] sm:p-6"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm shadow-orange-200">
            <Store className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#9A5A00]">
              Buka Cabang Baru
            </p>

            <p className="mt-0.5 text-xs text-[#B7791F]">
              Tambahkan toko atau cabang baru ke akunmu
            </p>
          </div>

          <ArrowRight className="size-5 text-[#FF8F00] transition-transform group-hover:translate-x-1" />
        </Link>

        {/* ================= LOGOUT ================= */}
        <section className="mt-8 border-t border-[#F5F5DC] pt-6">

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full rounded-xl border-[#C62828]/20 bg-white font-bold text-[#C62828] shadow-sm transition-colors hover:border-[#C62828]/30 hover:bg-[#C62828]/5 hover:text-[#C62828]"
            >
              <LogOut className="mr-2 size-5" />
              Keluar dari Akun
            </Button>
          </form>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            Pastikan pekerjaanmu sudah tersimpan sebelum keluar.
          </p>

        </section>

      </main>
    </div>
  );
}

function ProfileMenuItem({
  href,
  icon: Icon,
  title,
  description,
  iconClassName,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#F5F5DC]/50 sm:px-6"
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        <Icon
          className="size-5"
          strokeWidth={2}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800 group-hover:text-[#C27800]">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {description}
        </p>
      </div>

      <ChevronRight className="size-5 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#FF8F00]" />
    </Link>
  );
}
