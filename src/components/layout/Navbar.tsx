"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import { Menu, X, MapPin, ChevronDown, ShoppingBag, LogIn, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import NavCartDrawer from "@/components/layout/NavCartDrawer";
import { useAuthStore } from "@/store/useAuthStore";

export default function Navbar() {
  const { site, setSite } = useSite();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [menuOpen, setMenuOpen]         = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [scrolled, setScrolled]         = useState(!isHome);
  const [cartOpen, setCartOpen]         = useState(false);
  const { totalItems } = useCart();
  const { session, isReady } = useAuthStore();
  const loggedIn = isReady ? !!session : false;

  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    setScrolled(window.scrollY > 60);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    const handler = () => setLocationOpen(false);
    if (locationOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [locationOpen]);

  const navLinks = [
    { label: "Home",        href: "/#home" },
    { label: "Restaurants", href: "/#restaurants" },
    { label: "How It Works",href: "/#how-it-works" },
    // { label: "Offers",      href: "/#offers" },
    { label: "Contact",     href: "/contact" },
  ];

  const navBg    = scrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100" : "bg-transparent";
  const textColor = scrolled ? "text-gray-800" : "text-white";
  const mutedText = scrolled ? "text-gray-500 hover:text-gray-900" : "text-white/80 hover:text-white";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-heading font-black text-sm shadow"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` }}
            >
              {site.name.charAt(0)}
            </div>
            <span className={`font-heading font-bold text-lg leading-tight ${textColor} transition-colors duration-300`}>
              {site.name}
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden lg:flex items-center gap-6">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`text-sm font-medium transition-colors duration-300 ${mutedText}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocationOpen(!locationOpen);
                }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300 ${
                  scrolled ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{site.location}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${locationOpen ? "rotate-180" : ""}`} />
              </button>

              {locationOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100">
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-gray-400 px-3 py-1.5 uppercase tracking-widest">
                      Choose location
                    </p>
                    {ALL_SITES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => { setSite(s.key as SiteKey); setLocationOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          s.key === site.key ? "text-white" : "text-gray-700 hover:bg-gray-50"
                        }`}
                        style={s.key === site.key ? { background: `linear-gradient(135deg, ${s.theme.gradientFrom}, ${s.theme.gradientTo})` } : {}}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {s.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth button — session-aware */}
            {loggedIn ? (
              <Link
                href="/dashboard"
                className={`hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full transition-all duration-300 ${
                  scrolled ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className={`hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full transition-all duration-300 ${
                  scrolled ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="hidden sm:flex relative items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-md whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`, color: "#fff" }}
            >
              <ShoppingBag className="w-4 h-4" />
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[10px] font-black flex items-center justify-center leading-none shadow"
                  style={{ color: site.theme.gradientFrom }}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-1.5 rounded-lg transition-colors ${scrolled ? "text-gray-800 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
          <ul className="px-4 py-3 space-y-0.5">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 py-3 px-2 rounded-xl text-base font-medium transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}

            {/* Auth link — session-aware */}
            {loggedIn ? (
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 py-3 px-2 rounded-xl text-base font-medium transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 py-3 px-2 rounded-xl text-base font-medium transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
              </li>
            )}

            <li className="pt-2 pb-1">
              <button
                onClick={() => { setMenuOpen(false); setCartOpen(true); }}
                className="relative w-full flex items-center justify-center gap-2 text-sm font-bold py-3.5 rounded-2xl text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
              >
                <ShoppingBag className="w-4 h-4" />
                My Cart
                {totalItems > 0 && (
                  <span className="ml-1 bg-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                    style={{ color: site.theme.gradientFrom }}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      )}

      <NavCartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}
