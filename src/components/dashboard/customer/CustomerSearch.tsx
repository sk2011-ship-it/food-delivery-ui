"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Clock, Star, Truck, ArrowRight, Flame } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getRestaurants } from "@/data/restaurants";
import { getMenu } from "@/data/menus";
import type { Restaurant } from "@/data/restaurants";

const RECENT = ["Pizza Palace", "Sushi", "Burgers", "Curry"];

const QUICK_TAGS = [
  "🍕 Pizza", "🍔 Burgers", "🍣 Sushi", "🍛 Curry",
  "🍗 Chicken", "🌮 Tacos", "🥗 Healthy", "🍰 Desserts",
];

interface DishResult {
  name: string;
  restaurant: string;
  restaurantId: string;
  price: string;
  emoji: string;
}

export default function CustomerSearch() {
  const { site } = useSite();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { gradientFrom, gradientTo, accent } = site.theme;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allRestaurants = getRestaurants(site.key);

  /* Search across restaurants and menu item names */
  const q = query.trim().toLowerCase();

  const restaurantResults: Restaurant[] = q
    ? allRestaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];

  const dishResults: DishResult[] = q
    ? allRestaurants.flatMap((r) => {
        const menu = getMenu(r.id);
        return menu.flatMap((section) =>
          section.items
            .filter((item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
            .map((item) => ({
              name: item.name,
              restaurant: r.name,
              restaurantId: r.id,
              price: item.price,
              emoji: section.emoji,
            }))
        );
      }).slice(0, 6)
    : [];

  const hasResults = restaurantResults.length > 0 || dishResults.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Search input */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 mb-6 transition-all"
        style={{ borderColor: q ? gradientFrom : "#e5e7eb" }}
      >
        <Search className="w-5 h-5 shrink-0" style={{ color: q ? gradientFrom : "#9ca3af" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants or dishes…"
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} className="p-0.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* ── Empty state: recent + quick picks ── */}
      {!q && (
        <div className="space-y-7">

          {/* Recent searches */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--dash-text-secondary)" }}>
              Recent searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {RECENT.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-300 bg-white transition-all hover:shadow-sm"
                >
                  <Clock className="w-3 h-3 text-gray-400" />
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Quick category tags */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--dash-text-secondary)" }}>
              <Flame className="w-3.5 h-3.5" style={{ color: accent }} />
              Popular in {site.location}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_TAGS.map((tag) => {
                const word = tag.split(" ")[1];
                return (
                  <button
                    key={tag}
                    onClick={() => setQuery(word)}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All restaurants teaser */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-secondary)" }}>
                All restaurants
              </h2>
              <Link
                href="/dashboard/customer"
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: accent }}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {allRestaurants.slice(0, 4).map((r) => (
                <RestaurantRow key={r.id} restaurant={r} theme={site.theme} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Search results ── */}
      {q && !hasResults && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-semibold text-gray-800">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-gray-400 mt-1">Try a different dish or restaurant name</p>
        </div>
      )}

      {q && hasResults && (
        <div className="space-y-6">

          {/* Dish results */}
          {dishResults.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--dash-text-secondary)" }}>
                Dishes
              </h2>
              <div className="space-y-2">
                {dishResults.map((dish) => (
                  <Link
                    key={`${dish.restaurantId}-${dish.name}`}
                    href={`/dashboard/customer/restaurant/${dish.restaurantId}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${gradientFrom}10` }}
                    >
                      {dish.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{dish.name}</p>
                      <p className="text-xs text-gray-400 truncate">{dish.restaurant}</p>
                    </div>
                    <p className="text-sm font-bold shrink-0" style={{ color: gradientFrom }}>
                      {dish.price}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Restaurant results */}
          {restaurantResults.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--dash-text-secondary)" }}>
                Restaurants ({restaurantResults.length})
              </h2>
              <div className="space-y-2">
                {restaurantResults.map((r) => (
                  <RestaurantRow key={r.id} restaurant={r} theme={site.theme} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RestaurantRow({
  restaurant: r,
  theme,
}: {
  restaurant: Restaurant;
  theme: { gradientFrom: string; gradientTo: string; accent: string; primary: string; gradientVia: string };
}) {
  return (
    <Link
      href={`/dashboard/customer/restaurant/${r.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all group"
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
        <Image src={r.image} alt={r.name} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
        <p className="text-xs font-medium truncate" style={{ color: theme.accent }}>{r.cuisine}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-600">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            {r.rating}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Truck className="w-3 h-3" />
            {r.deliveryFee}
          </span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
    </Link>
  );
}
