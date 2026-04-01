"use client";

import { useState } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import { Menu, X, MapPin, ChevronDown, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const { site, setSite } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Restaurants", href: "#restaurants" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Offers", href: "#offers" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass theme-transition"
      style={{ borderBottom: `2px solid ${site.theme.accent}33` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="#home" className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-heading font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` }}
            >
              {site.name.charAt(0)}
            </div>
            <span className="font-heading font-bold text-white text-lg leading-tight">
              {site.name}
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden lg:flex items-center gap-6">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Location switcher */}
            <div className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{site.location}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${locationOpen ? "rotate-180" : ""}`} />
              </button>

              {locationOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-400 px-3 py-1 uppercase tracking-wide">
                      Choose location
                    </p>
                    {ALL_SITES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => {
                          setSite(s.key as SiteKey);
                          setLocationOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          s.key === site.key
                            ? "text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={
                          s.key === site.key
                            ? { background: `linear-gradient(135deg, ${s.theme.gradientFrom}, ${s.theme.gradientTo})` }
                            : {}
                        }
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

            {/* Order button */}
            <a
              href="#restaurants"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${site.theme.accent}, ${site.theme.gradientTo})`,
                color: "#1C0A00",
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              Order Now
            </a>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden text-white p-1"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-black/60 backdrop-blur-lg border-t border-white/10">
          <ul className="px-4 py-4 space-y-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-white/90 hover:text-white py-2.5 text-base font-medium border-b border-white/10 last:border-0"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#restaurants"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${site.theme.accent}, ${site.theme.gradientTo})`,
                  color: "#1C0A00",
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Order Now
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
