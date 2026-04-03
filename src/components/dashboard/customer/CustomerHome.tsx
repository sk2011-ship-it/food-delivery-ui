"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Flame,
  Pizza, Beef, Fish, Salad, Drumstick, Cookie, Soup, ArrowRight,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { SessionUser } from "@/lib/auth";
import FeaturedRestaurants from "@/components/sections/FeaturedRestaurants";
import DishesGrid from "@/components/dashboard/customer/DishesGrid";

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
  const { gradientFrom, gradientVia, gradientTo, accent } = site.theme;

  return (
    <div className="min-h-screen bg-[var(--dash-bg)]">
      {/* ── Hero ── */}
      <section
        className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 px-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientVia} 55%, ${gradientTo} 100%)`,
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: gradientTo }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: gradientFrom }}
        />

        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide">
            {greeting()}, {user.name.split(" ")[0]} 👋
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white mb-8 leading-tight">
            What are you craving<br className="hidden sm:block" /> in {site.location} today?
          </h1>

          {/* Search CTA */}
          <Link
            href="/dashboard/customer/search"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-5 py-4 max-w-xl mx-auto hover:shadow-3xl transition-all hover:-translate-y-0.5 group"
          >
            <Search className="w-5 h-5 text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
            <span className="flex-1 text-sm text-gray-400 text-left">Search restaurants or dishes…</span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ background: accent }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 56" fill="none" className="w-full">
            <path
              d="M0 56L60 48C120 41 240 25 360 19C480 13 600 19 720 25C840 31 960 31 1080 25C1200 19 1320 13 1380 9L1440 6V56H0Z"
              fill="var(--dash-bg)"
            />
          </svg>
        </div>
      </section>

      {/* ── Featured Restaurants ── */}
      <FeaturedRestaurants />

      {/* ── Main content wrapper ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Category chips ── */}
        <section className="pt-2 pb-10">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 shrink-0" />
            <h2 className="font-heading font-black text-lg sm:text-xl text-gray-900">
              What are you in the mood for?
            </h2>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
            {CATEGORIES.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {}}
                className="group/cat flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-gray-100 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ "--tw-ring-color": accent } as React.CSSProperties}
                aria-label={`Filter by ${label}`}
              >
                <span
                  className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 group-hover/cat:scale-110 group-hover/cat:rotate-3"
                  style={{ background: `${gradientFrom}18` }}
                >
                  <Icon
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
                    style={{ color: gradientFrom }}
                    strokeWidth={1.75}
                  />
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold text-gray-600 text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Dishes Section ── */}
        <section className="pb-16">
          <DishesGrid />
        </section>

      </div>
    </div>
  );
}
