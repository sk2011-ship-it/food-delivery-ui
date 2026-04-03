"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { featuredApi, type PublicFeaturedDish } from "@/lib/api";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";

export default function FeaturedDishes() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const res = await featuredApi.listDishes(site.location);
      if (res.success && res.data) {
        setFeatured(res.data.items);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, [site.location]);

  // Auto-scroll logic (every 3 seconds)
  useEffect(() => {
    if (featured.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [featured.length]);

  // Scroll to the current slide
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollAmount = currentIndex * (scrollContainerRef.current.offsetWidth / getVisibleItems());
      scrollContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const getVisibleItems = () => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  if (!loading && featured.length === 0) return null;

  return (
    <section key={site.key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-xl flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            Spotlight Dishes in {site.location}
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1">Our chef's top recommendations for you</p>
        </div>
        <Link
          href="/dashboard/customer/all-dishes"
          className="text-sm font-bold flex items-center gap-1.5 transition-all hover:gap-2.5 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 hover:shadow-md"
          style={{ color: site.theme.accent }}
        >
          See all dishes <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-1"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="min-w-[300px] sm:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)]">
                <SkeletonDishCard />
              </div>
            ))
          ) : (
            featured.map((dish, i) => (
              <div
                key={dish.id}
                className="min-w-[280px] sm:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] scroll-snap-align-start transition-opacity duration-300"
                style={{ scrollSnapAlign: "start" }}
              >
                <DishCard
                  dish={dish}
                  theme={site.theme}
                  priority={i < 2}
                  featured={true}
                />
              </div>
            ))
          )}
        </div>

        {/* Navigation Arrows */}
        {!loading && featured.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-10 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featured.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-10 hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {!loading && featured.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-6" : "w-1.5 opacity-30"
                  }`}
                style={{ backgroundColor: i === currentIndex ? site.theme.accent : "gray" }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
