"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, UtensilsCrossed, Tag, Info, ArrowRight } from "lucide-react";
import type { AdminMenuItemResponse, PublicFeaturedDish } from "@/lib/api";

interface DishCardProps {
  dish: AdminMenuItemResponse | PublicFeaturedDish;
  theme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
  };
  featured?: boolean;
  priority?: boolean;
}

export default function DishCard({
  dish,
  theme,
  featured = false,
  priority = false,
}: DishCardProps) {
  const router = useRouter();

  // Normalize data
  const id = "entityId" in dish ? dish.entityId : dish.id;
  const name = dish.name;
  const restaurantName = "restaurantName" in dish ? dish.restaurantName : "";
  const imageUrl = dish.imageUrl;
  // Ensure we safely format price
  const price = typeof dish.price === 'number' ? dish.price : parseFloat(dish.price || "0");
  const category = dish.category;
  const status = "status" in dish ? dish.status : "available";
  const description = "description" in dish ? dish.description : "";

  const isUnavailable = status === "unavailable";

  return (
    <div
      onClick={() => !isUnavailable && router.push(`/dashboard/customer/dish/${id}`)}
      className={`group/dish relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${isUnavailable ? "cursor-not-allowed opacity-75 grayscale-[0.2]" : "cursor-pointer"}`}
      style={{ "--tw-ring-color": theme.accent } as React.CSSProperties}
      role="button"
      tabIndex={isUnavailable ? -1 : 0}
      onKeyDown={(e) => {
        if (!isUnavailable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          router.push(`/dashboard/customer/dish/${id}`);
        }
      }}
    >
      {/* Image Section */}
      <div className={`relative ${featured ? "h-56 sm:h-64" : "h-48"} w-full bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority={priority}
            className={`object-cover transition-transform duration-500 ease-out ${!isUnavailable ? "group-hover/dish:scale-105" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 gap-2">
              <UtensilsCrossed className="w-10 h-10" />
              <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
           </div>
        )}

        {/* Subtle dynamic gradient overlay for text readability if badges are present */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {featured && (
            <div
              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm"
              style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
            >
              <Sparkles className="w-3 h-3 fill-white/80" />
              Featured
            </div>
          )}
          {isUnavailable && (
            <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold bg-black/80 text-white px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
              <Info className="w-3 h-3 text-red-400" />
              Sold Out
            </div>
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3 z-10 transition-transform duration-300 ease-out group-hover/dish:-translate-y-1">
          <div className="bg-white/95 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-1.5 border border-white/20">
            <Tag className="w-3 h-3" style={{ color: theme.accent }} />
            <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
              £{!isNaN(price) ? price.toFixed(2) : "0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-heading font-black text-gray-900 text-base sm:text-lg leading-tight line-clamp-1 group-hover/dish:text-gray-700 transition-colors mb-1.5">
            {name}
          </h3>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            <span style={{ color: theme.accent }}>{category || "Dish"}</span>
            {restaurantName && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                <span className="line-clamp-1">{restaurantName}</span>
              </>
            )}
          </div>

          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 group-hover/dish:text-gray-600 transition-colors">
            <span>View details</span>
          </div>

          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 ease-out ${isUnavailable ? "bg-gray-300" : "group-hover/dish:scale-110 group-hover/dish:rotate-6 group-hover/dish:shadow-lg"}`}
            style={!isUnavailable ? { background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` } : {}}
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDishCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse h-full flex flex-col">
      <div className="h-48 sm:h-56 bg-gray-100" />
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="h-5 sm:h-6 w-3/4 bg-gray-200 rounded-lg mb-3" />
          <div className="h-3 w-1/2 bg-gray-100 rounded-lg mb-4" />
          <div className="space-y-2">
             <div className="h-2.5 w-full bg-gray-100 rounded" />
             <div className="h-2.5 w-4/5 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
          <div className="h-3 w-20 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
