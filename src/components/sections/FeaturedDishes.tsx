"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { featuredApi, type PublicFeaturedDish } from "@/lib/api";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";

function getVisibleItems(): number {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

export default function FeaturedDishes() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  const maxIndex = Math.max(0, featured.length - visibleCount);

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

  // Track visible count on resize
  useEffect(() => {
    const update = () => setVisibleCount(getVisibleItems());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset index when location changes
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
            <span className="truncate">Spotlight Dishes in {site.location}</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1 ml-7">Our chef's top recommendations for you</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/customer/all-dishes"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 hover:shadow-md whitespace-nowrap"
            style={{ color: site.theme.accent }}
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-3"
          style={{ scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {loading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-none self-start"
                style={{ scrollSnapAlign: "start" }}
              >
                <SkeletonDishCard />
              </div>
            ))
          ) : (
            featured.map((dish, i) => (
              <div
                key={dish.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-none self-start"
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
        {!loading && featured.length > 1 && (
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
          href="/dashboard/customer/all-dishes"
          className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-full bg-white shadow-sm border border-gray-100"
          style={{ color: site.theme.accent }}
        >
          See all dishes <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
