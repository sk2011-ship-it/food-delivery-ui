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
    <section id="all-restaurants" className="py-20 bg-dash-bg shadow-inset">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-white mb-4 shadow-lg shadow-primary/20"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
              }}
            >
              Nearby {site.location}
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Local Culinary <br className="hidden sm:block" /> Treasures
            </h2>
            <p className="text-gray-500 mt-4 max-w-lg text-lg font-medium leading-relaxed">
              Every restaurant delivering in {site.location} — handpicked for quality and speed.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-soft">
            <div className="px-4 py-2 text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Total</p>
              <p className="text-xl font-black text-gray-900">{restaurants.length} Places</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} theme={site.theme} />
          ))}
        </div>
      </div>
    </section>
  );
}
