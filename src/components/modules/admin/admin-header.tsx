"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  /** Title displayed in the center/left of the header */
  title: string;
  /** Show back arrow button instead of store name */
  showBack?: boolean;
  /** Optional right-side action element (overrides default bell icon) */
  rightAction?: React.ReactNode;
  /** Additional className for the header container */
  className?: string;
}

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminHeader({
  title,
  showBack = false,
  rightAction,
  className,
}: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center justify-between bg-slate-900 px-4 text-white",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:bg-white/10"
            aria-label="Kembali"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <h1 className="text-base font-semibold truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {rightAction ?? (
          <>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:bg-white/10"
              aria-label="Notifikasi"
            >
              <Bell className="size-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-red-400 transition-colors active:bg-white/10"
              aria-label="Keluar"
            >
              <LogOut className="size-5" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
