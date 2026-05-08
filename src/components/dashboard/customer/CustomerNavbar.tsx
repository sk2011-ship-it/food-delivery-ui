"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams, usePathname } from "next/navigation";
import {
  Search, ShoppingBag, ChevronDown, MapPin,
  User, ShoppingBag as OrdersIcon, Settings, LogOut, Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import type { SessionUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export default function CustomerNavbar({ user: serverUser }: { user: SessionUser | null }) {
  const { site, setSite } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile, isReady } = useAuthStore();

  // Once the client-side store is ready, use the DB profile (always fresh).
  // Until then, fall back to the server-passed user to avoid a "Sign In" flash
  // on first render before the auth listener fires.
  const user = isReady ? (profile ?? serverUser) : serverUser;

  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef  = useRef<HTMLDivElement>(null);

  // Update URL on search change
  const handleSearch = (val: string) => {
    setSearchValue(val);
    
    if (pathname !== "/dashboard/customer/search") {
      if (val) {
        router.push(`/dashboard/customer/search?search=${encodeURIComponent(val)}`);
      }
    } else {
      const params = new URLSearchParams(searchParams);
      if (val) params.set("search", val);
      else params.delete("search");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node))
        setLocationOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await useAuthStore.getState().logout();
    toast.success("Logged out.");
    router.push("/login");
  };

  const { totalItems } = useCart();

  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "";
  const firstName = user?.name ? user.name.split(" ")[0] : "";

  const { gradientFrom, gradientTo, accent } = site.theme;
  const isCheckoutPage = pathname.includes("/dashboard/customer/checkout");
  const isRestaurantPage = pathname.includes("/dashboard/customer/restaurant");
  const canSwitchLocation = !isCheckoutPage && !isRestaurantPage;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-3 py-2.5">

          {/* ── LEFT: Logo + location ── */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
              >
                {site.name.charAt(0)}
              </div>
              <span className="font-heading font-bold text-gray-900 text-sm hidden sm:block leading-tight">
                {site.name}
              </span>
            </Link>

            {/* Location pill */}
            <div className="relative" ref={locationRef}>
              <button
                onClick={() => canSwitchLocation && setLocationOpen(!locationOpen)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
                  !canSwitchLocation ? "cursor-default opacity-80" : ""
                }`}
                style={{
                  borderColor: `${gradientFrom}35`,
                  color: gradientFrom,
                  background: `${gradientFrom}08`,
                }}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{site.location}</span>
                {canSwitchLocation && (
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-150 ${locationOpen ? "rotate-180" : ""}`} />
                )}
              </button>

              {canSwitchLocation && locationOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <p className="text-[9px] font-black text-gray-400 px-3 pt-2.5 pb-1 uppercase tracking-widest">
                    Switch location
                  </p>
                  {ALL_SITES.map((s) => {
                    const active = s.key === site.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => { setSite(s.key as SiteKey); setLocationOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors"
                        style={
                          active
                            ? { background: `linear-gradient(135deg, ${s.theme.gradientFrom}, ${s.theme.accent})`, color: "#fff" }
                            : { color: "#374151" }
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: active ? "#fff" : s.theme.gradientFrom }}
                        />
                        {s.name}
                      </button>
                    );
                  })}
                  <div className="h-1.5" />
                </div>
              )}
            </div>
          </div>

          {/* ── MIDDLE: Global Search ── */}
          {!pathname.includes("/dashboard/customer/search") && pathname !== "/dashboard/customer" && (
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    "--tw-ring-color": `${accent}33`,
                    borderColor: searchValue ? accent : "border-gray-100" 
                  } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {/* ── RIGHT: Actions ── */}
          <div className="flex items-center gap-0.5 shrink-0">

            {/* Mobile Search Icon (Links to Search Page) */}
            <Link
              href="/dashboard/customer/search"
              className="sm:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Restaurants Option for Desktop/Web view */}
            <Link
              href="/dashboard/customer/all-restaurants"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 mr-1"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              title="All Restaurants"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Restaurants</span>
            </Link>

            {/*
            <Link
              href="/dashboard/customer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors hover:bg-gray-100"
              style={{ color: accent }}
              title="Offers"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Offers</span>
            </Link>
            */}

            {/* Cart / Bag */}
            <Link
              href="/dashboard/customer/cart"
              className="relative p-2 rounded-xl transition-colors hover:bg-gray-100"
              title="My Bag"
            >
              <ShoppingBag
                className="w-5 h-5 transition-colors"
                style={{ color: totalItems > 0 ? gradientFrom : "#6b7280" }}
              />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center leading-none shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Profile dropdown — only for logged-in users */}
            {user ? (
              <div className="relative ml-0.5" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                  >
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-gray-800 max-w-[80px] truncate">
                    {firstName}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Compact user header */}
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      {[
                        { label: "My Profile",  href: "/dashboard/customer/profile",  icon: User },
                        { label: "My Orders",   href: "/dashboard/customer/orders",   icon: OrdersIcon },
                        { label: "Settings",    href: "/dashboard/customer/settings", icon: Settings },
                      ].map(({ label, href, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5 text-gray-400" />
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest — show Sign In button */
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 ml-1"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Logout</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">
                  Are you sure you want to log out? You'll need to sign in again to access your orders.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
