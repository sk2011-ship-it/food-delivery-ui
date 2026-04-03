"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { ArrowLeft, Search, Utensils, MessageSquareText } from "lucide-react";
import { dishesApi, type AdminMenuItemResponse } from "@/lib/api";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";

export default function AllDishesPage() {
  const { site } = useSite();
  const [dishes, setDishes] = useState<AdminMenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      const res = await dishesApi.list({
        location: site.location,
        search: search || undefined,
        limit: 100
      });
      if (res.success && res.data) {
        setDishes(res.data.items);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchDishes, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [site.location, search]);

  const { gradientFrom, accent } = site.theme;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Search */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest mb-4 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Home
          </Link>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-gray-900 flex items-center gap-3">
            <Utensils className="w-8 h-8 text-orange-500" />
            Every dish in {site.location}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-2">Discover the best food from local restaurants</p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a dish, craving or restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-2 transition-all focus:shadow-lg text-sm font-medium"
            style={{ "--tw-focus-ring-color": `${accent}30` } as any}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <SkeletonDishCard key={n} />
          ))}
        </div>
      ) : dishes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} theme={site.theme} featured={(dish as any).isFeatured} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquareText className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="font-black text-2xl text-gray-900 mb-2">No dishes found</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            We couldn't find any dishes matching "{search}" in {site.location}.
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-8 px-6 py-3 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: gradientFrom }}
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
