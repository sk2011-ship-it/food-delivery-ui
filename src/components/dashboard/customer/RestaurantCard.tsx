"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { Star, Clock, Sparkles, Store, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestaurantItem, FeaturedItem } from "@/types/api.types";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

type RestaurantCardData =
  | RestaurantItem
  | FeaturedItem
  | {
      id: string;
      name: string;
      image?: string | null;
      cuisine?: string | null;
      rating?: string | number | null;
      deliveryTime?: string | null;
      openingHours?: RestaurantItem["openingHours"];
    };

interface RestaurantCardProps {
  restaurant: RestaurantCardData;
  theme: {
    gradientFrom: string;
    primary: string;
    accent: string;
  };
  featured?: boolean;
  priority?: boolean;
}

export default function RestaurantCard({
  restaurant,
  theme,
  featured = false,
  priority = false,
}: RestaurantCardProps) {
  const router = useRouter();

  // Unified mapping for both API and older Mock data
  const id = "entityId" in restaurant ? restaurant.entityId : restaurant.id;
  const name = restaurant.name;
  const image = "logoUrl" in restaurant ? restaurant.logoUrl : ("image" in restaurant ? restaurant.image : null);
  const cuisine = "cuisine" in restaurant ? restaurant.cuisine ?? "" : "";
  const rating = "rating" in restaurant ? restaurant.rating ?? null : null;
  const deliveryTime = "deliveryTime" in restaurant ? restaurant.deliveryTime ?? null : null;
  const openingHours = restaurant.openingHours ?? null;

  const isOpen = isRestaurantOpen(openingHours);
  const titleStyle = { "--group-hover-color": theme.accent } as CSSProperties;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex flex-col h-full overflow-hidden rounded-[2rem] border border-border/40 bg-white transition-all duration-500",
        "hover:shadow-elevated shadow-soft",
        !isOpen && "opacity-95"
      )}
    >
      {/* Visual Depth Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div
        className="absolute inset-x-0 top-0 h-1.5 opacity-80"
        style={{ background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.accent})` }}
      />

      {/* Image Container */}
      <div className={cn(
        "relative w-full overflow-hidden shrink-0 bg-muted/20",
        featured ? "aspect-[1.12/0.78]" : "aspect-[1.06/0.74]"
      )}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
            <Store className="h-12 w-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-55 mix-blend-screen pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 18%, ${theme.accent}55 0%, transparent 28%), radial-gradient(circle at 82% 18%, ${theme.gradientFrom}44 0%, transparent 24%), linear-gradient(180deg, transparent 40%, ${theme.primary}22 100%)`,
          }}
        />

        {!isOpen && (
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-rose-500/20 via-rose-400/10 to-transparent pointer-events-none" />
        )}
        {/* Glass Badge - Top Left */}
        {featured && (
          <div className="absolute left-4 top-4 z-10">
            <div 
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-tight text-white shadow-lg backdrop-blur-xl"
              style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent}cc)` }}
            >
              <Sparkles className="h-3.5 w-3.5 fill-white/80" />
              <span>HANDPICKED</span>
            </div>
          </div>
        )}

        {/* Glass Rating - Bottom Left */}
        {rating && (
          <div className={cn("absolute z-10", featured ? "bottom-4 right-4" : "bottom-4 left-4")}>
            <div className="glass-premium flex items-center gap-1 rounded-full px-3 py-1.5 shadow-xl">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-black text-gray-900">{rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3">
          <h3
            className="font-heading text-[1.05rem] sm:text-lg font-black leading-tight text-gray-900 line-clamp-1 transition-colors duration-300"
            style={titleStyle}
          >
            <span className="group-hover:text-[var(--group-hover-color)] transition-colors duration-300">
              {name}
            </span>
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: `${theme.accent}12`, color: theme.accent }}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{rating ? String(rating) : "4.5"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>{deliveryTime || "35-45 mins"}</span>
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-50">
              <MapPin className="h-2.5 w-2.5" style={{ color: theme.accent }} />
            </span>
            <span className="line-clamp-1 font-medium text-gray-600">{cuisine || "Global Dining"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50">
              <Store className="h-2.5 w-2.5" style={{ color: theme.accent }} />
            </span>
            <span className={cn("line-clamp-1 font-semibold", isOpen ? "text-emerald-600" : "text-rose-600")}>
              {isOpen ? "Open now" : "Closed for now"}
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => router.push(`/dashboard/customer/restaurant/${id}`)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-5 inline-flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-all duration-300 cursor-pointer border border-transparent shadow-sm"
          style={{
            color: theme.accent,
            background: `linear-gradient(135deg, ${theme.gradientFrom}14, ${theme.accent}14)`,
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.18em] leading-none">
            Explore menu
          </span>
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>

  );
}
