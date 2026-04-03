"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { Sparkles, ChevronRight, ChevronLeft, ArrowRight, Store } from "lucide-react";
import { featuredApi, type PublicFeaturedRestaurant } from "@/lib/api";
import RestaurantCard from "@/components/dashboard/customer/RestaurantCard";

export default function FeaturedRestaurants() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    featuredApi.listRestaurants(site.location).then((res) => {
      if (res.success && res.data) setFeatured(res.data.items);
      setLoading(false);
    });
  }, [site.location]);

  // Auto-scroll removed as requested

  // Sync scroll position
  useEffect(() => {
    if (!scrollRef.current) return;
    const visibleItems = getVisibleCount();
    const cardWidth = scrollRef.current.offsetWidth / visibleItems;
    scrollRef.current.scrollTo({ left: currentIndex * cardWidth, behavior: "smooth" });
  }, [currentIndex]);

  function getVisibleCount() {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }

  const prev = () => setCurrentIndex((p) => (p - 1 + featured.length) % featured.length);
  const next = () => setCurrentIndex((p) => (p + 1) % featured.length);

  if (!loading && featured.length === 0) return null;

  return (
    <section key={site.key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="font-heading font-black text-lg sm:text-xl flex items-center gap-2 text-gray-900 leading-tight">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="truncate">Handpicked Favourites in {site.location}</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1 ml-7">Our top picks for your location</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile: just See All */}
          <Link
            href="/dashboard/customer/all-restaurants"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 hover:shadow-md whitespace-nowrap"
            style={{ color: site.theme.accent }}
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
          {/* Arrow controls */}
          {featured.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous restaurants"
                className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition-all active:scale-90"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={next}
                aria-label="Next restaurants"
                className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition-all active:scale-90"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="min-w-[85vw] sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] shrink-0" style={{ scrollSnapAlign: "start" }}>
                <SkeletonCard />
              </div>
            ))
          ) : (
            <>
              {featured.map((restaurant, i) => (
                <div
                  key={restaurant.id}
                  className="min-w-[85vw] sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <RestaurantCard restaurant={restaurant} theme={site.theme} priority={i < 2} featured />
                </div>
              ))}

              {/* See All Bridge Card */}
              <div
                className="min-w-[85vw] sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <Link
                  href="/dashboard/customer/all-restaurants"
                  className="group/bridge flex flex-col items-center justify-center h-full min-h-[260px] rounded-3xl border-2 border-dashed border-gray-200 hover:border-orange-300 bg-white hover:bg-orange-50/30 transition-all duration-300 p-8 text-center gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover/bridge:scale-110 group-hover/bridge:rotate-6 transition-transform duration-300"
                    style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
                  >
                    <ArrowRight className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-black text-lg text-gray-900">View All</p>
                    <p className="text-xs text-gray-400 font-semibold mt-1 uppercase tracking-widest">
                      All Restaurants in {site.location}
                    </p>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {!loading && featured.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-5">
          {[...Array(featured.length + 1)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                i === currentIndex ? "w-6" : "w-1.5 opacity-30 hover:opacity-60"
              }`}
              style={{ backgroundColor: i === currentIndex ? site.theme.accent : "#9ca3af" }}
            />
          ))}
        </div>
      )}

      {/* Mobile See All link */}
      <div className="sm:hidden flex justify-center mt-5">
        <Link
          href="/dashboard/customer/all-restaurants"
          className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-full bg-white shadow-sm border border-gray-100"
          style={{ color: site.theme.accent }}
        >
          See all restaurants <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-52 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 bg-gray-100 rounded-lg" />
        <div className="h-3 w-1/4 bg-gray-50 rounded-lg" />
        <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
          <div className="h-4 w-1/3 bg-gray-50 rounded-lg" />
          <div className="h-8 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}
