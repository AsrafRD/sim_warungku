"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface AdminHeaderProps {
  /** Title displayed in the center/left of the header */
  title: string;
  /** Show back arrow button */
  showBack?: boolean;
  /** Optional right-side action element */
  rightAction?: React.ReactNode;
  /** Additional className */
  className?: string;
}

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
        `
          sticky top-0 z-40
          flex h-14 shrink-0
          items-center justify-between
          border-b border-[#E8DFB5]
          bg-white/95
          px-4
          text-slate-800
          backdrop-blur-xl
          supports-[backdrop-filter]:bg-white/85
        `,
        className
      )}
    >
      {/* Left */}

      <div className="flex min-w-0 items-center gap-2.5">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="
              flex size-9 shrink-0
              items-center justify-center
              rounded-xl
              text-slate-500
              transition-all duration-200
              hover:bg-[#FFF3DD]
              hover:text-[#FF8F00]
              active:scale-95
              active:bg-[#FFE8C2]
            "
            aria-label="Kembali"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        <h1
          className="
            truncate
            text-[15px]
            font-bold
            tracking-tight
            text-slate-800
          "
        >
          {title}
        </h1>
      </div>

      {/* Right */}

      <div className="flex shrink-0 items-center gap-1">
        {rightAction ?? (
          <button
            type="button"
            className="
              relative
              flex size-9
              items-center justify-center
              rounded-xl
              text-slate-500
              transition-all duration-200
              hover:bg-[#FFF3DD]
              hover:text-[#FF8F00]
              active:scale-95
              active:bg-[#FFE8C2]
            "
            aria-label="Notifikasi"
          >
            <Bell className="size-[19px]" />

            {/* Notification indicator */}
            <span
              className="
                absolute
                right-2 top-2
                size-1.5
                rounded-full
                bg-[#FF8F00]
                ring-2
                ring-white
              "
            />
          </button>
        )}
      </div>
    </header>
  );
}
