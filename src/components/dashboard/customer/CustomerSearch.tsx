"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, Clock, ArrowRight, Flame, Store, ChevronLeft } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { customerService } from "@/services/customer.service";
import type { RestaurantItem, MenuItem } from "@/types/api.types";
import { useSearchParams, useRouter } from "next/navigation";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { cn } from "@/lib/utils";

const RECENT = ["Pizza", "Burger", "Chicken", "Salad"];

const QUICK_TAGS = [
  "🍕 Pizza", "🍔 Burger", "🍗 Chicken", "🥗 Salad",
  "🍰 Dessert", "🥪 Sandwich", "🍜 Noodles", "🍣 Sushi",
];

export default function CustomerSearch() {
  const { site } = useSite();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const term = searchParams.get("search");
    if (term !== null) {
      setQuery(prev => prev !== term ? term : prev);
    }
  }, [searchParams]);

  const [restaurantResults, setRestaurantResults] = useState<RestaurantItem[]>([]);
  const [dishResults, setDishResults] = useState<MenuItem[]>([]);
  const [defaultRestaurants, setDefaultRestaurants] = useState<RestaurantItem[]>([]);

  const { gradientFrom, accent } = site.theme;

  useEffect(() => {
    inputRef.current?.focus();
    
    // Fetch default restaurants for the empty state
    customerService.getRestaurants({ location: site.location }).then(res => {
      if (res.success && res.data) {
        setDefaultRestaurants(res.data.items);
      }
    });
  }, [site.location]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setRestaurantResults([]);
      setDishResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [resRes, dishRes] = await Promise.all([
          customerService.getRestaurants({ location: site.location }),
          customerService.getDishes({ location: site.location, search: q, limit: 6 })
        ]);

        if (resRes.success && resRes.data) {
          setRestaurantResults(resRes.data.items.filter((r: RestaurantItem) => 
            r.name.toLowerCase().includes(q)
          ));
        }

        if (dishRes.success && dishRes.data) {
          setDishResults(dishRes.data.items);
        }
      } catch (err) {
        console.error("Failed to fetch search results", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, site.location]);

  const q = query.trim().toLowerCase();
  const hasResults = restaurantResults.length > 0 || dishResults.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Header with Back button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          style={{ color: "var(--dash-text-secondary)" }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading font-black text-2xl text-gray-900">Search</h1>
      </div>

      {/* Search input */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 mb-8 transition-all"
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
                href="/dashboard/customer/all-restaurants"
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: accent }}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {defaultRestaurants.slice(0, 4).map((r) => (
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
                    key={`${dish.restaurantId}-${dish.id}`}
                    href={`/dashboard/customer/restaurant/${dish.restaurantId}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden relative"
                      style={{ background: `${gradientFrom}10` }}
                    >
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.name} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        "🍽️"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{dish.name}</p>
                      <p className="text-xs text-gray-400 truncate">{dish.restaurantName || "Restaurant"}</p>
                    </div>
                    <p className="text-sm font-bold shrink-0" style={{ color: gradientFrom }}>
                      £{Number(dish.price).toFixed(2)}
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
  restaurant: RestaurantItem;
  theme: { gradientFrom: string; gradientTo: string; accent: string; primary: string; gradientVia: string };
}) {
  return (
    <Link
      href={`/dashboard/customer/restaurant/${r.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all group",
        !isRestaurantOpen(r.openingHours) && "grayscale opacity-80"
      )}
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
        {r.logoUrl ? (
          <img src={r.logoUrl} alt={r.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Store className="w-8 h-8 text-gray-300" style={{ color: theme.accent }} />
        )}
        {!isRestaurantOpen(r.openingHours) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[7px] font-black uppercase text-white tracking-widest">Closed</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
          {!isRestaurantOpen(r.openingHours) && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Closed</span>
          )}
        </div>
        {/* Fake cuisine / rating / delivery since they aren't on base RestaurantItem model yet */}
        <p className="text-xs font-medium truncate" style={{ color: theme.accent }}>Restaurant</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
    </Link>
  );
}
