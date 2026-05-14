"use client";

import Image from "next/image";
import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import { Search, MapPin, Star, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSearchStore } from "@/store/useSearchStore";

export default function HeroSection() {
  const { site, setSite } = useSite();
  const { query, setQuery } = useSearchStore();

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

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
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
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("all-restaurants")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto lg:mx-0 mb-8"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find restaurant"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-gray-800 placeholder-gray-400 text-sm font-medium outline-none shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap text-center text-white"
                style={{
                  background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientVia})`,
                  filter: "brightness(0.85)",
                }}
              >
                Find Restaurant
              </button>
            </form>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {[
                { icon: <Star className="w-4 h-4 fill-white" />, value: site.stats.rating, label: "Rating" },
                { icon: <MapPin className="w-4 h-4" />, value: site.stats.restaurants, label: "Restaurants" },
                { icon: <Clock className="w-4 h-4" />, value: `${site.stats.minutes} min`, label: "Avg delivery" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-white">
                  <span className="opacity-80">{s.icon}</span>
                  <div>
                    <p className="font-heading font-black text-xl leading-none">{s.value}</p>
                    <p className="text-xs opacity-60">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — photo + location switcher */}
          <div className="flex flex-col items-center gap-6">
            {/* Hero food image */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 float">
              <div
                className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white/30"
              >
                <Image
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=85"
                  alt="Delicious food delivery"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating info badges */}
              <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {site.stats.rating}
              </div>
              <div
                className="absolute -bottom-3 -left-3 rounded-2xl shadow-xl px-3 py-2 text-white text-sm font-bold flex items-center gap-1.5"
                style={{
                  background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                }}
              >
                <Clock className="w-4 h-4" />
                {site.stats.minutes} min delivery
              </div>
            </div>

            {/* Location switcher */}
            <div className="flex gap-3 flex-wrap justify-center">
              {ALL_SITES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSite(s.key as SiteKey)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                    s.key === site.key
                      ? "text-white border-white scale-105 shadow-lg bg-white/10"
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
      <div className="absolute bottom-0 left-0 right-0 leading-[0]">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
          <path
            d="M0 80L60 69.3C120 59 240 37 360 32C480 27 600 37 720 42.7C840 48 960 48 1080 42.7C1200 37 1320 27 1380 21.3L1440 16V80H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
