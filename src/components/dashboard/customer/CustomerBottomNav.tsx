"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Search, User, Settings } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const tabs = [
  { label: "Home",     href: "/dashboard/customer",          icon: Home },
  { label: "Orders",   href: "/dashboard/customer/orders",   icon: ShoppingBag },
  { label: "Search",   href: "/dashboard/customer/search",   icon: Search },
  { label: "Profile",  href: "/dashboard/customer/profile",  icon: User },
  { label: "Settings", href: "/dashboard/customer/settings", icon: Settings },
];

export default function CustomerBottomNav() {
  const pathname = usePathname();
  const { site } = useSite();
  const { gradientFrom } = site.theme;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
      <div className="flex items-stretch h-16">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isHome = href === "/dashboard/customer";
          const active = isHome ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95"
            >
              {active && (
                <span
                  className="absolute top-1.5 w-10 h-10 rounded-2xl"
                  style={{ background: `${gradientFrom}12` }}
                />
              )}
              <Icon
                className="w-5 h-5 relative z-10 transition-colors"
                style={{ color: active ? gradientFrom : "#9ca3af" }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className="text-[10px] font-semibold relative z-10 transition-colors"
                style={{ color: active ? gradientFrom : "#9ca3af" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-bottom bg-white" />
    </nav>
  );
}
