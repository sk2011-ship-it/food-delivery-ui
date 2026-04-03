"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Clock, Truck, Sparkles, Store, ArrowRight } from "lucide-react";
import type { Restaurant } from "@/data/restaurants";
import type { PublicFeaturedRestaurant } from "@/lib/api";

interface RestaurantCardProps {
  restaurant: Restaurant | PublicFeaturedRestaurant;
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

export default function RestaurantCard({
  restaurant,
  theme,
  featured = false,
  priority = false,
}: RestaurantCardProps) {
  const router = useRouter();

  // Handle both mock and API types
  const id = "entityId" in restaurant ? restaurant.entityId : restaurant.id;
  const name = restaurant.name;
  const image = "logoUrl" in restaurant ? restaurant.logoUrl : restaurant.image;
  const location = "location" in restaurant ? restaurant.location : "";
  
  // Mock-only fields (or future DB fields)
  const cuisine = "cuisine" in restaurant ? restaurant.cuisine : "";
  const description = "description" in restaurant ? restaurant.description : "";
  const rating = "rating" in restaurant ? restaurant.rating : null;
  const reviews = "reviews" in restaurant ? restaurant.reviews : null;
  const deliveryTime = "deliveryTime" in restaurant ? restaurant.deliveryTime : null;
  const deliveryFee = "deliveryFee" in restaurant ? restaurant.deliveryFee : null;
  const promo = "promo" in restaurant ? restaurant.promo : null;

  return (
    <div
      onClick={() => router.push(`/dashboard/customer/restaurant/${id}`)}
      className="group/rest bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer flex flex-col focus:outline-none focus:ring-2 focus:ring-offset-2 transform-gpu"
      style={{ "--tw-ring-color": theme.accent, WebkitMaskImage: '-webkit-radial-gradient(white, black)' } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/dashboard/customer/restaurant/${id}`);
        }
      }}
    >
      {/* Image */}
      <div className={`relative ${featured ? "h-48 sm:h-56 lg:h-64" : "h-44 sm:h-48"} w-full bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden`}>
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover/rest:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 gap-2">
             <Store className="w-10 h-10" />
             <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
          </div>
        )}
        
        {/* Subtle dynamic gradient overlay for text readability if badges are present */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {(featured || ("type" in restaurant && restaurant.type === "restaurant")) && (
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm z-10"
            style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
          >
            <Sparkles className="w-3 h-3 fill-white/80" />
            Featured
          </div>
        )}

        {promo && (
          <div className="absolute top-3 right-3 text-[10px] sm:text-[11px] font-bold bg-white text-gray-800 px-2.5 py-1 rounded-full shadow-md z-10">
            {promo}
          </div>
        )}

        {rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 z-10 transition-transform duration-300 group-hover/rest:-translate-y-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-[11px] sm:text-xs font-bold leading-none">{rating}</span>
            {reviews !== null && <span className="text-white/70 text-[10px] font-medium leading-none ml-0.5">({reviews})</span>}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-heading font-black text-gray-900 text-base sm:text-lg leading-tight line-clamp-1 group-hover/rest:text-gray-700 transition-colors mb-1.5">
            {name}
          </h3>
          
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            {cuisine && (
              <span style={{ color: theme.accent }}>{cuisine}</span>
            )}
          </div>
          
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 font-medium group-hover/rest:text-gray-700 transition-colors">
            {deliveryTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {deliveryTime}
              </span>
            )}
            {deliveryFee && (
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                {deliveryFee}
              </span>
            )}
            {!deliveryTime && !deliveryFee && (
               <span className="text-gray-400 flex items-center gap-1 font-bold opacity-0 hidden">
                 {/* Empty space placeholder */}
               </span>
            )}
          </div>
          
          <div
            className="flex items-center flex-shrink-0 gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 text-white shadow-md group-hover/rest:shadow-lg group-hover/rest:scale-105"
            style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
          >
            <span>Explore Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
