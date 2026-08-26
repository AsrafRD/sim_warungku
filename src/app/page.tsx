import Link from "next/link";
import { Store, ArrowRight, Smartphone, Printer, Box } from "lucide-react";
import { auth } from "@/auth";
import { getCurrentStoreId } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const storeSlug = await getCurrentStoreId();
  const hasStore = !!storeSlug;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 rounded-b-[3rem] opacity-90 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <main className="flex-1 flex flex-col relative z-10 px-6 pt-20 pb-12 max-w-md mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-10 text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md mx-auto mb-6 shadow-xl border border-white/20">
            <Store className="size-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 drop-shadow-sm">
            Warung SaaS
          </h1>
          <p className="text-white/80 text-lg font-medium max-w-[280px] mx-auto">
            Sistem Kasir & Manajemen Stok Modern untuk Warung Anda.
          </p>
        </div>

        {/* Feature Cards (Glassmorphism) */}
        <div className="space-y-4 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
              <Smartphone className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Mobile-First PWA</h3>
              <p className="text-xs text-slate-500 mt-0.5">Akses cepat dan ringan dari HP seperti aplikasi native.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
              <Box className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Multi-Tenant Stok</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kelola banyak toko dengan pencatatan stok real-time.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600 shrink-0">
              <Printer className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Bluetooth Printer</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cetak struk langsung dari browser via Web Bluetooth.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <Link
            href={
              isLoggedIn
                ? // @ts-ignore
                  session.user.role === "SUPPLIER"
                  ? "/supplier"
                  : hasStore
                  ? `/${storeSlug}/products`
                  : "/onboarding"
                : "/login"
            }
            className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-[#FF8F00] text-white font-semibold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-[0.98] active:scale-95"
          >
            {isLoggedIn 
              ? (
                  // @ts-ignore
                  session.user.role === "SUPPLIER" ? "Masuk ke Dashboard Supplier" 
                  : (hasStore ? "Masuk ke Dashboard Toko" : "Buat Toko Anda")
                ) 
              : "Mulai Sekarang"}
            <ArrowRight className="size-5" />
          </Link>
          <p className="text-center text-xs text-black/60 mt-4">
            {isLoggedIn ? "Anda sudah masuk ke sistem" : "Gratis selamanya untuk fitur dasar"}
          </p>
        </div>
      </main>
    </div>
  );
}
