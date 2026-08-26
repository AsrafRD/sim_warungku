"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Store, Truck } from "lucide-react";
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
  const [role, setRole] = useState<"OWNER" | "SUPPLIER">("OWNER");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]>
  >({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await registerAction({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (result.success) {
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
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8F00]/10 text-[#FF8F00] mx-auto mb-4">
          <Store className="size-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Buat Akun Baru
        </h1>

        <p className="text-sm text-slate-500 mt-1.5">
          Mulai kelola bisnis Anda dengan mudah
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>

          <Input
            id="name"
            type="text"
            placeholder="Contoh: Budi Santoso"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl"
            disabled={isPending}
            autoComplete="name"
          />

          {fieldErrors.name && (
            <p className="text-xs text-red-500">
              {fieldErrors.name[0]}
            </p>
          )}
        </div>

        {/* Email */}
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
            <p className="text-xs text-red-500">
              {fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* Password */}
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
            autoComplete="new-password"
          />

          {fieldErrors.password && (
            <p className="text-xs text-red-500">
              {fieldErrors.password[0]}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-2 pt-2">
          <Label>Mendaftar Sebagai</Label>

          <div className="grid grid-cols-2 gap-3">
            {/* Owner */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setRole("OWNER")}
              className={`relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-2xl border-2 transition-all ${
                role === "OWNER"
                  ? "border-[#FF8F00] bg-[#FF8F00]/10 text-[#FF8F00] shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-[#FF8F00]/40 hover:bg-orange-50/30"
              }`}
            >
              <Store className="size-6" />

              <span className="text-sm font-bold">
                Pemilik Toko
              </span>

              <span
                className={`text-[10px] ${
                  role === "OWNER"
                    ? "text-[#FF8F00]/80"
                    : "text-slate-400"
                }`}
              >
                Kelola toko & kasir
              </span>

              {role === "OWNER" && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF8F00]" />
              )}
            </button>

            {/* Supplier */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setRole("SUPPLIER")}
              className={`relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-2xl border-2 transition-all ${
                role === "SUPPLIER"
                  ? "border-[#FF8F00] bg-[#FF8F00]/10 text-[#FF8F00] shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-[#FF8F00]/40 hover:bg-orange-50/30"
              }`}
            >
              <Truck className="size-6" />

              <span className="text-sm font-bold">
                Supplier
              </span>

              <span
                className={`text-[10px] ${
                  role === "SUPPLIER"
                    ? "text-[#FF8F00]/80"
                    : "text-slate-400"
                }`}
              >
                Kelola produk & order
              </span>

              {role === "SUPPLIER" && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF8F00]" />
              )}
            </button>
          </div>

          {fieldErrors.role && (
            <p className="text-xs text-red-500">
              {fieldErrors.role[0]}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-[#FF8F00] hover:bg-[#e68100] text-white font-semibold text-[15px] shadow-sm transition-all active:scale-[0.98]"
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

      {/* Login */}
      <div className="mt-8 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#FF8F00] hover:text-[#e68100]"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
