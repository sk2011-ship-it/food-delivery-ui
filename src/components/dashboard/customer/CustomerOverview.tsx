"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag, Clock, Star, Flame, Zap, TrendingUp,
  ChevronRight, MapPin, Search, Gift, Sparkles, Truck,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useSite } from "@/context/SiteContext";
import { getFeaturedRestaurants } from "@/data/restaurants";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const recentOrders = [
  {
    id: "#1038",
    restaurant: "Pizza Palace",
    image: "🍕",
    items: "Margherita · Garlic Bread",
    total: "£18.50",
    status: "Delivered",
    statusColor: "#22c55e",
    statusBg: "#f0fdf4",
    date: "Today, 12:30",
  },
  {
    id: "#1021",
    restaurant: "The Anchor Bar",
    image: "🍔",
    items: "Burger · Chips · Coke",
    total: "£26.00",
    status: "Delivered",
    statusColor: "#22c55e",
    statusBg: "#f0fdf4",
    date: "Yesterday",
  },
  {
    id: "#1009",
    restaurant: "Sushi Station",
    image: "🍣",
    items: "California Roll x2",
    total: "£22.00",
    status: "Delivered",
    statusColor: "#22c55e",
    statusBg: "#f0fdf4",
    date: "3 days ago",
  },
  {
    id: "#0997",
    restaurant: "Curry House",
    image: "🍛",
    items: "Chicken Tikka · Naan",
    total: "£19.90",
    status: "Cancelled",
    statusColor: "#ef4444",
    statusBg: "#fef2f2",
    date: "5 days ago",
  },
];

const categories = [
  { label: "Pizza",   emoji: "🍕" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Sushi",   emoji: "🍣" },
  { label: "Curry",   emoji: "🍛" },
  { label: "Chicken", emoji: "🍗" },
  { label: "Dessert", emoji: "🍰" },
  { label: "Chinese", emoji: "🥡" },
  { label: "Tacos",   emoji: "🌮" },
];

const quickStats = [
  { label: "Orders placed",  value: "14",    icon: ShoppingBag,  color: "#F97316", bg: "#fff3e8" },
  { label: "Avg. wait",      value: "26m",   icon: Clock,        color: "#8b5cf6", bg: "#f5f3ff" },
  { label: "Fav. place",     value: "Pizza Palace", icon: Star, color: "#f59e0b", bg: "#fffbeb" },
  { label: "Total spent",    value: "£86",   icon: TrendingUp,   color: "#06b6d4", bg: "#ecfeff" },
];

export default function CustomerOverview({ user }: { user: SessionUser }) {
  const firstName = user.name.split(" ")[0];
  const { site } = useSite();
  const featured = getFeaturedRestaurants(site.key);

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Desktop 2-col / Mobile 1-col layout ── */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 space-y-5 lg:space-y-0">

        {/* ══════════════ LEFT COLUMN ══════════════ */}
        <div className="space-y-5">

          {/* Hero greeting */}
          <div
            className="relative rounded-3xl p-6 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #111111 0%, #1f1f1f 50%, #292524 100%)" }}
          >
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
              style={{ background: "var(--dash-accent)" }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full opacity-10 blur-2xl"
              style={{ background: "#f59e0b" }}
            />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--dash-accent)" }}>
                  {greeting()} 👋
                </p>
                <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {firstName},<br className="sm:hidden" /> what are you craving?
                </h1>
                <p className="text-white/50 text-sm mt-1 mb-4">
                  Order from your favourite local restaurants
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "var(--dash-accent)" }}
                >
                  <Zap className="w-4 h-4" />
                  Browse Restaurants
                </Link>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: "rgba(249,115,22,0.25)", border: "1.5px solid rgba(249,115,22,0.4)" }}
              >
                {user.name[0].toUpperCase()}
              </div>
            </div>
          </div>

          {/* Search bar (visual / links to restaurants) */}
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all hover:shadow-md"
            style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
            <span className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
              Search restaurants, dishes…
            </span>
          </Link>

          {/* Quick stats — 2×2 on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-base font-bold leading-tight truncate" style={{ color: "var(--dash-text-primary)" }}>
                  {value}
                </p>
                <p className="text-xs leading-tight" style={{ color: "var(--dash-text-secondary)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Food categories */}
          <div
            className="rounded-3xl p-5"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--dash-text-primary)" }}>
                <Flame className="w-4 h-4" style={{ color: "var(--dash-accent)" }} />
                What are you in the mood for?
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {categories.map(({ label, emoji }) => (
                <Link
                  key={label}
                  href="/"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-card-border)",
                  }}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] font-medium text-center leading-tight" style={{ color: "var(--dash-text-primary)" }}>
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Featured restaurants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--dash-text-primary)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "var(--dash-accent)" }} />
                Featured in {site.location}
              </h2>
              <Link
                href="/"
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: "var(--dash-accent)" }}
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {featured.map((r) => (
                <div
                  key={r.id}
                  className="shrink-0 w-56 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
                >
                  <div className="relative h-32 w-full">
                    <Image
                      src={r.image}
                      alt={r.name}
                      fill
                      className="object-cover"
                      sizes="224px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div
                      className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Featured
                    </div>
                    {r.promo && (
                      <div className="absolute top-2 right-2 text-[10px] font-bold bg-white text-gray-800 px-2 py-0.5 rounded-full">
                        {r.promo}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold truncate" style={{ color: "var(--dash-text-primary)" }}>
                      {r.name}
                    </p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--dash-accent)" }}>
                      {r.cuisine}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-600">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {r.rating}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>
                        <Clock className="w-3 h-3" />
                        {r.deliveryTime}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>
                        <Truck className="w-3 h-3" />
                        {r.deliveryFee.includes("Free") ? "Free" : r.deliveryFee.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo banner */}
          <div
            className="rounded-3xl p-5 flex items-center gap-4 overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Free delivery this week!</p>
              <p className="text-white/70 text-xs mt-0.5">Use code FREESHIP at checkout</p>
            </div>
            <Link
              href="/"
              className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              Order now
            </Link>
          </div>
        </div>

        {/* ══════════════ RIGHT COLUMN ══════════════ */}
        <div className="space-y-5">

          {/* Active order tracker */}
          <div
            className="rounded-3xl p-5"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "var(--dash-text-primary)" }}>
                Active Order
              </h2>
            </div>
            <div className="flex items-center gap-3 py-4 justify-center flex-col text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--dash-accent-light)" }}
              >
                <MapPin className="w-6 h-6" style={{ color: "var(--dash-accent)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                  No active order
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
                  Your live order will appear here
                </p>
              </div>
              <Link
                href="/"
                className="mt-1 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "var(--dash-accent)" }}
              >
                Place an order
              </Link>
            </div>
          </div>

          {/* Recent orders */}
          <div
            className="rounded-3xl p-5"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "var(--dash-text-primary)" }}>
                Recent Orders
              </h2>
              <Link
                href="/dashboard/customer/orders"
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: "var(--dash-accent)" }}
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:shadow-sm cursor-pointer"
                  style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-card-border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: "var(--dash-card)" }}
                  >
                    {order.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate" style={{ color: "var(--dash-text-primary)" }}>
                        {order.restaurant}
                      </p>
                      <p className="text-xs font-bold shrink-0" style={{ color: "var(--dash-text-primary)" }}>
                        {order.total}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>
                        {order.date}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: order.statusColor, background: order.statusBg }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
