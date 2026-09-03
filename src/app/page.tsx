import Link from "next/link";
import {
  Store,
  ArrowRight,
  Smartphone,
  Printer,
  Box,
  Check,
} from "lucide-react";
import { auth } from "@/auth";
import { getCurrentStoreId } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const storeSlug = await getCurrentStoreId();
  const hasStore = !!storeSlug;

  const isSupplier = session?.user?.role === "SUPPLIER";

  const destination = isLoggedIn
    ? isSupplier
      ? "/supplier"
      : hasStore
        ? `/${storeSlug}/products`
        : "/onboarding"
    : "/login";

  const buttonText = isLoggedIn
    ? isSupplier
      ? "Masuk ke Dashboard Supplier"
      : hasStore
        ? "Masuk ke Dashboard Toko"
        : "Buat Toko Anda"
    : "Mulai Sekarang";

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#F5F5DC]">

      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[430px] overflow-hidden">

        {/* Main warm gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FBC02D] via-[#FFAA00] to-[#FF8F00]" />

        {/* Soft beige fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F5F5DC] to-transparent" />

        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />

        <div className="absolute -left-24 top-40 size-56 rounded-full bg-[#F5F5DC]/10 blur-3xl" />

        <div className="absolute right-10 top-24 size-20 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm" />

      </div>


      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-5 pt-8 sm:px-6 sm:pt-20">

        {/* =====================================================
            HERO
        ===================================================== */}

        <div className="mb-5 text-center text-white animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* Logo */}
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-[26px] border border-white/30 bg-white/15 shadow-xl backdrop-blur-md">

            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Store className="size-7 text-[#FF8F00]" />
            </div>

          </div>

          <h1 className="mb-2 text-4xl font-black tracking-tight drop-shadow-sm">
            WarungKu
          </h1>

          <p className="mx-auto max-w-[300px] text-base font-medium leading-relaxed text-white/85">
            Sistem kasir & manajemen stok modern untuk penjualan Anda.
          </p>

        </div>


        {/* =====================================================
            FEATURES
        ===================================================== */}

        <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-8 delay-150 duration-700 fill-mode-both">

          {/* Feature 1
          <FeatureCard
            icon={Smartphone}
            title="Mobile-First PWA"
            description="Akses cepat dan ringan dari HP seperti aplikasi native."
            iconClass="bg-[#FFF3D6] text-[#FF8F00]"
          /> */}

          {/* Feature 2 */}
          <FeatureCard
            icon={Box}
            title="Multi-Tenant Stok"
            description="Kelola banyak toko dengan pencatatan stok yang sinkron."
            iconClass="bg-[#FFF8D8] text-[#D99A00]"
          />

          {/* Feature 3 */}
          <FeatureCard
            icon={Printer}
            title="Bluetooth Printer"
            description="Cetak struk langsung dari aplikasi dengan printer thermal."
            iconClass="bg-[#FDE8E8] text-[#C62828]"
          />

        </div>


        {/* =====================================================
            MINI TRUST SECTION
        ===================================================== */}

        <div className="mb-4 flex items-center justify-center gap-5 text-xs font-medium text-slate-500">

          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="size-3" />
            </span>
            Mudah digunakan
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="size-3" />
            </span>
            Mobile friendly
          </div>

        </div>


        {/* =====================================================
            CTA
        ===================================================== */}

        <div className="mt-auto animate-in fade-in slide-in-from-bottom-8 delay-300 duration-700 fill-mode-both">

          <Link
            href={destination}
            className="
              group
              flex h-14 w-full
              items-center justify-center gap-2
              rounded-2xl
              bg-[#FF8F00]
              text-lg font-black text-white
              shadow-[0_12px_30px_rgba(255,143,0,0.30)]
              transition-all
              hover:bg-[#E98200]
              hover:shadow-[0_14px_35px_rgba(255,143,0,0.35)]
              active:scale-[0.97]
            "
          >
            {buttonText}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Tombol Demo Sandbox Web Trial */}
          <Link
            href="/trial"
            className="
              group
              mt-3 flex h-14 w-full
              items-center justify-center gap-2
              rounded-2xl
              bg-white
              border-2 border-[#FF8F00]
              text-lg font-black text-[#FF8F00]
              shadow-sm
              transition-all
              hover:bg-orange-50/50
              hover:shadow-[0_10px_25px_rgba(255,143,0,0.15)]
              active:scale-[0.97]
            "
          >
            <Box className="size-5" />
            Coba Demo Kasir Gratis (Trial)
          </Link>

          <a
            href="/warungku-v1.0.0.apk"
            download
            className="
              group
              mt-3 flex h-12 w-full
              items-center justify-center gap-2
              rounded-xl
              bg-slate-900/5
              text-sm font-bold text-slate-700
              transition-all
              hover:bg-slate-900/10
              active:scale-[0.98]
            "
          >
            <Smartphone className="size-4" />
            Download APK Client (Khusus Kasir)
          </a>

          <p className="mt-4 text-center text-xs font-medium text-slate-500">
            {isLoggedIn
              ? "Anda sudah masuk ke sistem"
              : "Coba langsung di browser tanpa perlu daftar akun"}
          </p>

        </div>

      </main>
    </div>
  );
}


/* =============================================================
   FEATURE CARD
============================================================= */

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div
      className="
        flex items-center gap-4
        rounded-2xl
        border border-white/70
        bg-white/90
        px-4
        py-2
        shadow-[0_4px_20px_rgba(120,90,20,0.06)]
        backdrop-blur-xl
      "
    >
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="size-6" />
      </div>

      <div className="min-w-0">
        <h3 className="font-bold text-slate-800">
          {title}
        </h3>

        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
