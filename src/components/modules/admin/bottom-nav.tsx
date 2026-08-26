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
};

const navItems: NavItem[] = [
  {
    label: "Home",
    icon: LayoutDashboard,
    href: "",
  },
  {
    label: "Produk",
    icon: Package,
    href: "/products",
  },
  {
    label: "POS",
    icon: ShoppingCart,
    href: "/pos",
  },
  {
    label: "Order",
    icon: ClipboardList,
    href: "/orders",
  },
  {
    label: "Profil",
    icon: UserCircle,
    href: "/profile",
  },
];

export function BottomNav() {
  const params = useParams<{ storeId: string }>();
  const pathname = usePathname();
  const storeId = params.storeId;

  return (
    <nav
      className="
        sticky bottom-0 z-50
        border-t border-[#E8DFB5]
        bg-white/95
        backdrop-blur-xl
        supports-[backdrop-filter]:bg-white/85
      "
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">

        {navItems.map((item) => {
          const href = `/${storeId}${item.href}`;

          const isActive =
            item.href === ""
              ? pathname === `/${storeId}` ||
                pathname === `/${storeId}/`
              : pathname.startsWith(href);

          const isPos = item.href === "/pos";

          return (
            <Link
              key={item.label}
              href={href}
              className="
                group
                relative
                flex h-full w-16
                flex-col
                items-center
                justify-end
                pb-1.5
              "
            >

              {/* Active / POS Icon */}

              <div
                className={cn(
                  `
                    absolute
                    flex items-center justify-center
                    transition-all duration-300
                  `,

                  isActive
                    ? `
                      -top-4
                      size-12
                      rounded-full
                      bg-[#FF8F00]
                      text-white
                      shadow-[0_6px_18px_rgba(255,143,0,0.35)]
                      ring-4
                      ring-[#F5F5DC]
                    `
                    : isPos
                    ? `
                      top-1.5
                      size-8
                      rounded-xl
                      bg-[#FFF0D6]
                      text-[#FF8F00]
                      group-hover:bg-[#FFE4BD]
                    `
                    : `
                      top-2
                      size-7
                      rounded-xl
                      bg-transparent
                      text-slate-400
                      group-hover:bg-[#FFF8E1]
                      group-hover:text-[#FF8F00]
                    `
                )}
              >
                <item.icon
                  className={cn(
                    "transition-transform duration-300",
                    isActive
                      ? "size-5"
                      : isPos
                      ? "size-5"
                      : "size-[18px]",
                    "group-active:scale-90"
                  )}
                />
              </div>

              {/* Label */}

              <span
                className={cn(
                  `
                    text-[10px]
                    font-semibold
                    transition-colors duration-300
                  `,
                  isActive
                    ? "text-[#FF8F00]"
                    : "text-slate-400 group-hover:text-[#FF8F00]"
                )}
              >
                {item.label}
              </span>

            </Link>
          );
        })}

      </div>

      {/* iOS Safe Area */}

      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  );
}
