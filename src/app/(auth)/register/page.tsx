"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/actions/auth.actions";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await registerAction({ name, email, password });
      
      if (result.success) {
        // Navigate to login page
        router.push("/login?registered=true");
      } else if (result.errors) {
        setFieldErrors(result.errors);
      } else {
        setError(result.message || "Gagal mendaftar");
      }
    });
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Buat Akun Baru
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Mulai kelola warung Anda dengan mudah
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl"
            disabled={isPending}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-500">{fieldErrors.name[0]}</p>
          )}
        </div>

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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimal 6 karakter"
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
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[15px] transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="size-5 animate-spin mr-2" />
                Mendaftar...
              </>
            ) : (
              "Daftar Sekarang"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
