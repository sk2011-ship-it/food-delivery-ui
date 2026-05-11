"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Store, Settings, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSite } from "@/context/SiteContext";
import { useCart } from "@/context/CartContext";

const tabs = [
  { label: "Home",        href: "/dashboard/customer",                  icon: Home },
  { label: "Restaurants", href: "/dashboard/customer/all-restaurants",  icon: Store },
  { label: "Cart",        href: "/dashboard/customer/cart",             icon: ShoppingBag, isCart: true },
  { label: "Orders",      href: "/dashboard/customer/orders",           icon: Package },
  { label: "Settings",    href: "/dashboard/customer/settings",         icon: Settings },
];

export default function CustomerBottomNav() {
  const pathname = usePathname();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const { totalItems } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
      <div className="flex items-stretch h-16">
        {tabs.map(({ label, href, icon: Icon, isCart }) => {
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

              {/* Icon wrapper — cart gets badge */}
              <span className="relative z-10">
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: active ? gradientFrom : isCart && mounted && totalItems > 0 ? gradientFrom : "#9ca3af" }}
                  strokeWidth={active || (isCart && mounted && totalItems > 0) ? 2.5 : 2}
                />
                {isCart && (
                  <AnimatePresence>
                    {mounted && totalItems > 0 && (
                      <motion.span
                        key={totalItems}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full text-white text-[9px] font-black flex items-center justify-center leading-none shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                      >
                        {totalItems > 99 ? "99+" : totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </span>

              <span
                className="text-[10px] font-semibold relative z-10 transition-colors"
                style={{ color: active ? gradientFrom : isCart && mounted && totalItems > 0 ? gradientFrom : "#9ca3af" }}
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
