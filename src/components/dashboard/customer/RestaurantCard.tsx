"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Clock, Truck, Sparkles, Store, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestaurantItem, FeaturedItem } from "@/types/api.types";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

interface RestaurantCardProps {
  restaurant: RestaurantItem | FeaturedItem | any; // Keep any for mock compatibility during transition
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
  const image = "logoUrl" in restaurant ? restaurant.logoUrl : (restaurant as any).image;
  const cuisine = (restaurant as any).cuisine || "";
  const rating = (restaurant as any).rating || null;
  const deliveryTime = (restaurant as any).deliveryTime || null;
  const openingHours = (restaurant as any).openingHours;

  const isOpen = isRestaurantOpen(openingHours);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push(`/dashboard/customer/restaurant/${id}`)}
      className={cn(
        "group relative flex flex-col h-full cursor-pointer overflow-hidden rounded-[2rem] border border-border/40 bg-white transition-all duration-500",
        "hover:shadow-elevated shadow-soft transform-gpu",
        !isOpen && "grayscale-[0.8] opacity-90"
      )}
    >
      {/* Visual Depth Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Image Container */}
      <div className={cn(
        "relative w-full overflow-hidden shrink-0 bg-muted/20",
        featured ? "h-28 sm:h-56 lg:h-64" : "h-28 sm:h-48"
      )}>
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
            <Store className="h-12 w-12" />
          </div>
        )}

        {/* Glass Badge - Top Left */}
        {(featured || (restaurant as any).type === "restaurant") && (
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
          <div className="absolute bottom-4 left-4 z-10">
            <div className="glass-premium flex items-center gap-1 rounded-full px-3 py-1.5 shadow-xl">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-black text-gray-900">{rating}</span>
            </div>
          </div>
        )}

        {/* Closed Overlay */}
        {!isOpen && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white/90 px-4 py-2 rounded-full shadow-2xl scale-110">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Currently Closed</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-3 sm:p-6">
        <div className="mb-2 sm:mb-4">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-heading text-sm sm:text-lg font-black leading-tight text-gray-900 line-clamp-1 transition-colors duration-300"
              style={{ "--group-hover-color": theme.accent } as any}
            >
              <span className="group-hover:text-[var(--group-hover-color)] transition-colors duration-300">
                {name}
              </span>
            </h3>
          </div>
          
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {cuisine || "Global Dining"}
            </span>
          </div>
        </div>

        {/* Separator / Metrics */}
        <div className="mt-auto flex items-center pt-3 sm:pt-5 border-t border-border/40">
          <div className="flex min-h-[20px] items-center gap-2 sm:gap-4 text-[11px] sm:text-[12px] font-bold text-muted-foreground">
            {deliveryTime && (
              <div className="flex items-center gap-1 sm:gap-1.5 transition-colors group-hover:text-gray-900">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: theme.accent }} />
                <span>{deliveryTime}</span>
              </div>
            )}
          </div>

          <motion.div
            whileHover={{
              scale: 1.02,
              backgroundColor: `${theme.accent}15`,
              borderColor: `${theme.accent}40`
            }}
            whileTap={{ scale: 0.98 }}
            className="ml-auto flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 sm:px-6 sm:py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-none transition-all duration-300 border border-transparent shadow-sm"
            style={{
              color: theme.accent,
              backgroundColor: `${theme.accent}08`,
            }}
          >
            <span className="hidden sm:inline">Explore Menu</span>
            <ArrowRight className="h-3.5 w-3.5 sm:hidden" />
          </motion.div>
        </div>
      </div>
    </motion.div>

  );
}
