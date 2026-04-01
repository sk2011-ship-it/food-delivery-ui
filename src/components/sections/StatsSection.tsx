"use client";

import { useSite } from "@/context/SiteContext";

export default function StatsSection() {
  const { site } = useSite();

  const stats = [
    { value: site.stats.restaurants, label: "Local Restaurants", emoji: "🏪" },
    { value: site.stats.deliveries, label: "Happy Orders", emoji: "📦" },
    { value: `${site.stats.rating}★`, label: "Average Rating", emoji: "⭐" },
    { value: `${site.stats.minutes} min`, label: "Avg Delivery Time", emoji: "⚡" },
  ];

  return (
    <section
      className="py-16 theme-transition"
      style={{
        background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 50%, ${site.theme.gradientTo} 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center text-white">
              <div className="text-4xl mb-2">{s.emoji}</div>
              <p className="font-heading font-black text-4xl sm:text-5xl mb-1">{s.value}</p>
              <p className="text-white/70 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
