"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/actions/auth.actions";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await loginAction({ email, password });
      
      if (result.success) {
        // Force refresh to update server components with new session
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
          Masuk ke Sistem Anda
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

      <div className="mt-8 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#FF8F00] hover:text-[#e68100]"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}
