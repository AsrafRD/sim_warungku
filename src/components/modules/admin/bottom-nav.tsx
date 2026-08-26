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
  { label: "POS", icon: ShoppingCart, href: "/pos" },
  { label: "Order", icon: ClipboardList, href: "/orders" },
  { label: "Profil", icon: UserCircle, href: "/profile" },
];

export function BottomNav() {
  const params = useParams<{ storeId: string }>();
  const pathname = usePathname();
  const storeId = params.storeId;

  return (
    <nav className="sticky bottom-0 z-50 border-t border-slate-200 bg-white">
      <div className="flex items-center justify-around px-2 pt-1 h-16">
        {navItems.map((item) => {
          const href = `/${storeId}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === `/${storeId}` || pathname === `/${storeId}/`
              : pathname.startsWith(href);

          return (
            <Link
              key={item.label}
              href={href}
              className="relative flex flex-col items-center w-14 h-full justify-end pb-1.5 group"
            >
              <div
                className={cn(
                  "absolute flex items-center justify-center transition-all duration-300 z-10",
                  isActive
                    ? "-top-4 h-12 w-12 rounded-full bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "top-2 h-6 w-6 text-slate-400 bg-transparent group-hover:text-slate-600"
                )}
              >
                <item.icon className="size-5 transition-transform duration-300" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-all duration-300",
                  isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
