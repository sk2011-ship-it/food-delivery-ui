"use client";

import Image from "next/image";
import { useSite } from "@/context/SiteContext";
import { Star, Clock, Truck, Store } from "lucide-react";
import RestaurantCard from "@/components/dashboard/customer/RestaurantCard";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useSearchStore } from "@/store/useSearchStore";

export default function RestaurantsGrid() {
  const { site } = useSite();
  const { query } = useSearchStore();
  const { normal: restaurants } = useRestaurants(query);

  return (
    <section id="all-restaurants" className="py-8 sm:py-14 lg:py-20 bg-dash-bg shadow-inset">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6 sm:mb-10 flex flex-row items-center justify-between gap-3">
          <div>
            <span
              className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-white mb-2 sm:mb-4 shadow-lg shadow-primary/20"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
              }}
            >
              Nearby {site.location}
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              Local Culinary Treasures
            </h2>
            <p className="text-gray-500 mt-1.5 sm:mt-3 max-w-lg text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
              Every restaurant in {site.location} — handpicked for quality and speed.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-gray-100 shadow-soft shrink-0">
            <div className="px-2 sm:px-4 py-1 sm:py-2 text-right">
              <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Total</p>
              <p className="text-base sm:text-xl font-black text-gray-900">{restaurants.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} theme={site.theme} />
          ))}
        </div>
      </div>
    </section>
  );
}
