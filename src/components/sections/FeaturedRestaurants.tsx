"use client";

import Image from "next/image";
import { useSite } from "@/context/SiteContext";
import { Star, Clock, Truck, Sparkles, ChevronRight } from "lucide-react";
import { getFeaturedRestaurants } from "@/data/restaurants";
import type { Restaurant } from "@/data/restaurants";

export default function FeaturedRestaurants() {
  const { site } = useSite();
  const featured = getFeaturedRestaurants(site.key);

  return (
    <section
      id="featured"
      className="py-20 relative overflow-hidden"
      style={{ background: "#0f0f0f" }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: site.theme.gradientFrom }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: site.theme.gradientTo }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-4"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Featured in {site.location}
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white leading-tight">
              Handpicked Favourites
            </h2>
            <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-md">
              Our team&apos;s top picks for {site.location} — the best restaurants delivering right now.
            </p>
          </div>
          <a
            href="#restaurants"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 shrink-0"
            style={{ color: site.theme.accent }}
          >
            See all restaurants <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((restaurant, i) => (
            <FeaturedCard
              key={restaurant.id}
              restaurant={restaurant}
              siteTheme={site.theme}
              priority={i < 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({
  restaurant,
  siteTheme,
  priority,
}: {
  restaurant: Restaurant;
  siteTheme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
  };
  priority?: boolean;
}) {
  return (
    <div className="group relative bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer">

      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Featured badge */}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
          }}
        >
          <Sparkles className="w-3 h-3" />
          Featured
        </div>

        {/* Promo badge */}
        {restaurant.promo && (
          <div className="absolute top-3 right-3 text-xs font-bold bg-white text-gray-900 px-2.5 py-1 rounded-full shadow">
            {restaurant.promo}
          </div>
        )}

        {/* Rating overlaid on image bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-white text-xs font-bold">{restaurant.rating}</span>
          <span className="text-white/50 text-xs">({restaurant.reviews})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-heading font-bold text-white text-lg leading-tight mb-1">
          {restaurant.name}
        </h3>
        <p className="text-xs font-medium mb-2" style={{ color: siteTheme.accent }}>
          {restaurant.cuisine}
        </p>
        <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
          {restaurant.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-300 bg-white/8 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/8">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {restaurant.deliveryTime}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              {restaurant.deliveryFee}
            </span>
          </div>
          <button
            className="text-white text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
            }}
          >
            Order now
          </button>
        </div>
      </div>
    </div>
  );
}
