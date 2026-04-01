"use client";

import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import { MapPin, ArrowRight } from "lucide-react";

export default function AppCTA() {
  const { site, setSite } = useSite();

  return (
    <section
      id="contact"
      className="py-20 theme-transition"
      style={{
        background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 50%, ${site.theme.gradientTo} 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="text-white text-center lg:text-left">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black mb-5 leading-tight">
              Ready to Order?
              <br />
              <span className="opacity-80">Get Food Fast.</span>
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Explore the best restaurants in {site.location} right now. No app download needed — order right from your browser.
            </p>

            <a
              href="#restaurants"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-xl"
              style={{ background: "white", color: site.theme.gradientFrom }}
            >
              Browse Restaurants
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Right — location cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {ALL_SITES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSite(s.key as SiteKey)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border-2 ${
                  s.key === site.key
                    ? "border-white bg-white/20 scale-[1.02]"
                    : "border-white/20 bg-white/10 hover:bg-white/15 hover:border-white/40"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ background: `linear-gradient(135deg, ${s.theme.gradientFrom}, ${s.theme.gradientTo})` }}
                >
                  📍
                </div>
                <div className="text-white">
                  <p className="font-heading font-bold">{s.name}</p>
                  <p className="text-white/60 text-sm">{s.stats.restaurants} restaurants · {s.stats.minutes} min avg</p>
                </div>
                {s.key === site.key && (
                  <span className="ml-auto text-white/60 text-xs font-bold uppercase tracking-wide">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
