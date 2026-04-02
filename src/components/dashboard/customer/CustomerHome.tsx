"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Star, Clock, Truck, Sparkles, Flame,
  Pizza, Beef, Fish, Salad, Drumstick, Cookie, Soup, ArrowRight,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getRestaurants, getFeaturedRestaurants } from "@/data/restaurants";
import type { Restaurant } from "@/data/restaurants";
import type { SessionUser } from "@/lib/auth";
// useRouter is used inside RestaurantCard below

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const CATEGORIES = [
  { label: "Pizza",    icon: Pizza },
  { label: "Burgers",  icon: Beef },
  { label: "Sushi",    icon: Fish },
  { label: "Healthy",  icon: Salad },
  { label: "Chicken",  icon: Drumstick },
  { label: "Desserts", icon: Cookie },
  { label: "Asian",    icon: Soup },
  { label: "Hot",      icon: Flame },
];

export default function CustomerHome({ user }: { user: SessionUser }) {
  const { site } = useSite();
  const router = useRouter();

  const featured = getFeaturedRestaurants(site.key);
  const all      = getRestaurants(site.key);

  const { gradientFrom, gradientVia, gradientTo, accent } = site.theme;

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative py-10 sm:py-14 px-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientVia} 55%, ${gradientTo} 100%)`,
        }}
      >
        {/* blobs */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: gradientTo }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: gradientFrom }}
        />

        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <p className="text-white/70 text-sm font-medium mb-1">{greeting()}, {user.name.split(" ")[0]} 👋</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-white mb-6 leading-tight">
            What are you craving<br className="hidden sm:block" /> in {site.location} today?
          </h1>

          {/* Search CTA — navigates to dedicated search page */}
          <Link
            href="/dashboard/customer/search"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-4 py-3.5 max-w-xl mx-auto hover:shadow-3xl transition-shadow"
          >
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="flex-1 text-sm text-gray-400">Search restaurants or dishes…</span>
            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full">
            <path
              d="M0 48L60 41.3C120 35 240 21 360 16C480 11 600 16 720 21.3C840 27 960 27 1080 21.3C1200 16 1320 11 1380 8L1440 5V48H0Z"
              fill="var(--dash-bg)"
            />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Category chips ── */}
        <section>
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--dash-text-primary)" }}>
            <Flame className="w-5 h-5" style={{ color: accent }} />
            What are you in the mood for?
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setQuery(label)}
                className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100"
              >
                <span
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${gradientFrom}15` }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: gradientFrom }} strokeWidth={1.75} />
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-gray-700 text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Featured restaurants ── (hidden when searching) */}
        {!query && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2" style={{ color: "var(--dash-text-primary)" }}>
                <Sparkles className="w-5 h-5" style={{ color: accent }} />
                Featured in {site.location}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((r, i) => (
                <RestaurantCard key={r.id} restaurant={r} theme={site.theme} featured priority={i < 2} />
              ))}
            </div>
          </section>
        )}

        {/* ── All restaurants ── */}
        <section>
          <h2 className="font-heading font-bold text-lg mb-4" style={{ color: "var(--dash-text-primary)" }}>
            All Restaurants in {site.location}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {all.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} theme={site.theme} priority={i < 3} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Restaurant card ── */
function RestaurantCard({
  restaurant: r,
  theme,
  featured = false,
  priority = false,
}: {
  restaurant: Restaurant;
  theme: { gradientFrom: string; gradientVia: string; gradientTo: string; primary: string; accent: string };
  featured?: boolean;
  priority?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/customer/restaurant/${r.id}`)}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={r.image}
          alt={r.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {featured && (
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1 rounded-full"
            style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
          >
            <Sparkles className="w-3 h-3" />
            Featured
          </div>
        )}

        {r.promo && (
          <div className="absolute top-3 right-3 text-[11px] font-bold bg-white text-gray-800 px-2.5 py-1 rounded-full shadow">
            {r.promo}
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-white text-[11px] font-bold">{r.rating}</span>
          <span className="text-white/60 text-[10px]">({r.reviews})</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-gray-900 mb-0.5">{r.name}</h3>
        <p className="text-xs font-medium mb-1" style={{ color: theme.accent }}>{r.cuisine}</p>
        <p className="text-xs text-gray-400 mb-3 line-clamp-1">{r.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {r.deliveryTime}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              {r.deliveryFee}
            </span>
          </div>
          <div
            className="text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
          >
            View menu
          </div>
        </div>
      </div>
    </div>
  );
}
