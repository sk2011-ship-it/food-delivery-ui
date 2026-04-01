"use client";

import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import { Search, MapPin, Star, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const { site, setSite } = useSite();
  const [query, setQuery] = useState("");

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden theme-transition"
      style={{
        background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 50%, ${site.theme.gradientTo} 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: site.theme.gradientTo }}
      />
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: site.theme.gradientFrom }}
      />

      {/* Floating food icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {["🍕", "🍔", "🌮", "🍜", "🍣", "🥗", "🍗", "🍩"].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-3xl opacity-10"
            style={{
              top: `${10 + i * 11}%`,
              left: i % 2 === 0 ? `${3 + i * 4}%` : undefined,
              right: i % 2 !== 0 ? `${3 + i * 4}%` : undefined,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            {/* Location pill */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <MapPin className="w-3.5 h-3.5" />
              Delivering in {site.location}
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.1]">
              {site.hero.headline}
            </h1>

            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl mx-auto lg:mx-0">
              {site.hero.subheadline}
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto lg:mx-0 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants or cuisine..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-gray-800 placeholder-gray-400 text-sm font-medium outline-none shadow-lg"
                />
              </div>
              <a
                href="#restaurants"
                className="px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap text-center"
                style={{
                  background: `linear-gradient(135deg, #1C0A00, #3D1A00)`,
                  color: site.theme.accent,
                }}
              >
                Find Food
              </a>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {[
                { icon: <Star className="w-4 h-4" />, value: site.stats.rating, label: "Rating" },
                { icon: "🏪", value: site.stats.restaurants, label: "Restaurants" },
                { icon: <Clock className="w-4 h-4" />, value: `${site.stats.minutes} min`, label: "Avg delivery" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-white">
                  <span className="text-sm opacity-70">{typeof s.icon === "string" ? s.icon : s.icon}</span>
                  <div>
                    <p className="font-heading font-black text-xl leading-none">{s.value}</p>
                    <p className="text-xs opacity-60">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — illustration + site switcher */}
          <div className="flex flex-col items-center gap-6">
            {/* Delivery illustration (CSS art + emoji) */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 float">
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-9xl shadow-2xl"
                style={{
                  background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), rgba(0,0,0,0.15))`,
                  border: "3px solid rgba(255,255,255,0.25)",
                }}
              >
                🛵
              </div>
              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {site.stats.rating}
              </div>
              <div
                className="absolute -bottom-3 -left-3 rounded-2xl shadow-xl px-3 py-2 text-white text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
              >
                ⚡ {site.stats.minutes} min delivery
              </div>
            </div>

            {/* Location switcher cards */}
            <div className="flex gap-3 flex-wrap justify-center">
              {ALL_SITES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSite(s.key as SiteKey)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                    s.key === site.key
                      ? "text-white border-white scale-105 shadow-lg"
                      : "text-white/60 border-white/20 hover:border-white/50 hover:text-white"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {s.location}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
        <ChevronDown className="w-6 h-6" />
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L60 69.3C120 59 240 37 360 32C480 27 600 37 720 42.7C840 48 960 48 1080 42.7C1200 37 1320 27 1380 21.3L1440 16V80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
