"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { Sparkles, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { featuredApi, type PublicFeaturedRestaurant } from "@/lib/api";
import RestaurantCard from "@/components/dashboard/customer/RestaurantCard";

function getVisibleCount(): number {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

export default function FeaturedRestaurants() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  // One ref per card so we can call scrollIntoView reliably
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Total items = featured + 1 "See All" bridge card
  const totalItems = featured.length + 1;
  const maxIndex = Math.max(0, totalItems - visibleCount);

  useEffect(() => {
    setLoading(true);
    featuredApi.listRestaurants(site.location).then((res) => {
      if (res.success && res.data) setFeatured(res.data.items);
      setLoading(false);
    });
  }, [site.location]);

  // Track visible count on resize
  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset index when data or visibleCount changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [site.location]);

  // Scroll the target card into view programmatically
  const scrollToIndex = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (!card || !scrollRef.current) return;
    isProgrammaticScroll.current = true;
    scrollRef.current.scrollTo({
      left: card.offsetLeft - scrollRef.current.offsetLeft,
      behavior: "smooth",
    });
    // Release lock after animation completes
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 450);
  }, []);

  useEffect(() => {
    scrollToIndex(currentIndex);
  }, [currentIndex, scrollToIndex]);

  // Update index from user swipe/drag
  const handleScroll = () => {
    if (isProgrammaticScroll.current || !scrollRef.current) return;
    const container = scrollRef.current;
    const firstCard = cardRefs.current[0];
    if (!firstCard) return;
    const gap = parseInt(window.getComputedStyle(container).columnGap) || 16;
    const step = firstCard.offsetWidth + gap;
    const rawIndex = Math.round(container.scrollLeft / step);
    const clamped = Math.min(rawIndex, maxIndex);
    setCurrentIndex(clamped);
  };

  const prev = () => {
    if (isProgrammaticScroll.current) return;
    setCurrentIndex((p) => Math.max(0, p - 1));
  };

  const next = () => {
    if (isProgrammaticScroll.current) return;
    setCurrentIndex((p) => Math.min(maxIndex, p + 1));
  };

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
          <Link
            href="/dashboard/customer/all-restaurants"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 hover:shadow-md whitespace-nowrap"
            style={{ color: site.theme.accent }}
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3"
          style={{ scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] flex-none self-start"
                style={{ scrollSnapAlign: "start" }}
              >
                <SkeletonCard />
              </div>
            ))
          ) : (
            <>
              {featured.map((restaurant, i) => (
                <div
                  key={restaurant.id}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] flex-none self-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <RestaurantCard restaurant={restaurant} theme={site.theme} priority={i < 2} featured />
                </div>
              ))}

              {/* See All Bridge Card */}
              <div
                ref={(el) => { cardRefs.current[featured.length] = el; }}
                className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] flex-none self-start"
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

        {/* Navigation Arrows */}
        {!loading && featured.length > 0 && (
          <>
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-50"
              style={{ color: site.theme.accent }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= maxIndex}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-50"
              style={{ color: site.theme.accent }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {!loading && totalItems > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: currentIndex === i ? "20px" : "6px",
                  height: "6px",
                  background: currentIndex === i ? site.theme.accent : "#d1d5db",
                }}
              />
            ))}
          </div>
        )}
      </div>

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
