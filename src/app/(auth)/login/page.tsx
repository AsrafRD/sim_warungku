"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/actions/auth.actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isClientApp, setIsClientApp] = useState(false);

  useEffect(() => {
    // Deteksi jika dibuka dari PWA standalone atau aplikasi kasir terinstal
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const isClientParam = searchParams.get("client") === "app";

    if (isStandalone || isClientParam) {
      setIsClientApp(true);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await loginAction({ email, password });

      if (result.success) {
        router.push(result.redirectUrl || "/");
        router.refresh();
      } else if (result.errors) {
        setFieldErrors(result.errors);
      } else {
        setError(result.message || "Gagal masuk");
      }
    });
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Selamat Datang Kembali
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          {isClientApp ? "Masuk ke Aplikasi Kasir" : "Masuk ke Sistem WarungKu"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl"
            disabled={isPending}
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl"
            disabled={isPending}
            autoComplete="current-password"
          />
          {fieldErrors.password && (
            <p className="text-xs text-red-500">{fieldErrors.password[0]}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-[#FF8F00] hover:bg-[#e68100] text-white font-semibold text-[15px] transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="size-5 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </Button>
        </div>
      </form>

      {/* Conditional Gatekeeping: Hide register link on installed client apps */}
      {isClientApp ? (
        <div className="mt-7 rounded-2xl bg-amber-50/80 border border-amber-200/70 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-xs mb-1">
            <ShieldCheck className="size-4 text-amber-600" />
            Aplikasi Kasir Terpasang
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Belum punya lisensi atau akun toko? Registrasi & pembelian lisensi hanya melalui website resmi.
          </p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[#FF8F00] hover:underline"
          >
            <Globe className="size-3.5" />
            Buka Website Resmi WarungKu
          </a>
        </div>
      ) : (
        <div className="mt-8 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#FF8F00] hover:text-[#e68100]"
          >
            Daftar sekarang
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Memuat halaman login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
