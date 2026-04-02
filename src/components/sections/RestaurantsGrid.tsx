"use client";

import Image from "next/image";
import { useSite } from "@/context/SiteContext";
import { Star, Clock, Truck } from "lucide-react";
import { getRestaurants } from "@/data/restaurants";
import type { Restaurant } from "@/data/restaurants";

export default function RestaurantsGrid() {
  const { site } = useSite();
  const restaurants = getRestaurants(site.key);

  return (
    <section id="all-restaurants" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-3"
            style={{
              background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
            }}
          >
            {site.location}
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900">
            All Restaurants
          </h2>
          <p className="text-gray-500 mt-2">
            Every restaurant delivering in {site.location} — order in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} siteTheme={site.theme} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RestaurantCard({
  restaurant,
  siteTheme,
}: {
  restaurant: Restaurant;
  siteTheme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
  };
}) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer group">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {restaurant.promo && (
          <span
            className="absolute top-3 left-3 text-xs font-bold text-white px-2.5 py-1 rounded-full shadow"
            style={{
              background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
            }}
          >
            {restaurant.promo}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-heading font-bold text-gray-900">{restaurant.name}</h4>
          <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full shrink-0">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            {restaurant.rating}
          </span>
        </div>
        <p className="text-xs font-medium mb-1" style={{ color: siteTheme.accent }}>
          {restaurant.cuisine}
        </p>
        <p className="text-xs text-gray-400 mb-4 line-clamp-1">{restaurant.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
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
            className="text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
            }}
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}
