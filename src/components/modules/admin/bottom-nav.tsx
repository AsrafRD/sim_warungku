"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isFab?: boolean;
};

const navItems: NavItem[] = [
  { label: "Home", icon: LayoutDashboard, href: "" },
  { label: "Produk", icon: Package, href: "/products" },
  { label: "POS", icon: ShoppingCart, href: "/pos", isFab: true },
  { label: "Order", icon: ClipboardList, href: "/orders" },
  { label: "Profil", icon: UserCircle, href: "/profile" },
];

export function BottomNav() {
  const params = useParams<{ storeId: string }>();
  const pathname = usePathname();
  const storeId = params.storeId;

  return (
    <nav className="sticky bottom-0 z-50 border-t border-slate-200 bg-white">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const href = `/${storeId}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === `/${storeId}` || pathname === `/${storeId}/`
              : pathname.startsWith(href);

          if (item.isFab) {
            return (
              <Link
                key={item.label}
                href={href}
                className="flex -mt-5 items-center justify-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95">
                  <item.icon className="size-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-slate-900"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <item.icon
                className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
