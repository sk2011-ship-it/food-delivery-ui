"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, UtensilsCrossed, Tag, ShoppingCart } from "lucide-react";
import type { AdminMenuItemResponse, PublicFeaturedDish } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useSite } from "@/context/SiteContext";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { toast } from "sonner";

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
  const { addItem } = useCart();
  const { site } = useSite();

  // Normalize data
  const id = "entityId" in dish ? dish.entityId : dish.id;
  const name = dish.name;
  const restaurantName = "restaurantName" in dish ? dish.restaurantName : "";
  const imageUrl = dish.imageUrl;
  // Ensure we safely format price
  const price = typeof dish.price === 'number' ? dish.price : parseFloat(dish.price || "0");
  const category = dish.category;
  const status = "status" in dish ? dish.status : "available";
  const openingHours = "openingHours" in dish ? dish.openingHours ?? null : null;

  const isUnavailable = status === "unavailable";
  const isRestaurantClosed = !isRestaurantOpen(openingHours);
  const isBlocked = isUnavailable || isRestaurantClosed;

  return (
    <div
      onClick={() => !isBlocked && router.push(`/dashboard/customer/dish/${id}`)}
      className={`group/dish relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border flex flex-col focus:outline-none focus:ring-2 focus:ring-offset-2 ${isBlocked ? "cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        "--tw-ring-color": theme.accent,
        background: `linear-gradient(180deg, rgba(255,255,255,0.99) 0%, ${theme.gradientFrom}08 100%)`,
        borderColor: isBlocked ? `${theme.accent}16` : `${theme.accent}46`,
        boxShadow: isBlocked
          ? "0 10px 24px rgba(15, 23, 42, 0.05)"
          : `0 14px 34px -16px ${theme.accent}55, 0 10px 20px rgba(15, 23, 42, 0.06)`,
      } as React.CSSProperties}
      role="button"
      tabIndex={isBlocked ? -1 : 0}
      onKeyDown={(e) => {
        if (!isBlocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          router.push(`/dashboard/customer/dish/${id}`);
        }
      }}
    >
      {/* Image Section */}
      <div
        className={`relative ${featured ? "h-42 sm:h-48 lg:h-52" : "h-40 sm:h-44"} w-full flex items-center justify-center shrink-0 overflow-hidden`}
        style={{ backgroundColor: `${theme.accent}12` }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority={priority}
            className={`object-cover transition-transform duration-500 ease-out ${!isBlocked ? "group-hover/dish:scale-105" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <UtensilsCrossed className="w-10 h-10" />
              <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
           </div>
        )}

        {/* Subtle dynamic gradient overlay for text readability if badges are present */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-45 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 18% 18%, ${theme.accent}50 0%, transparent 28%), radial-gradient(circle at 82% 12%, ${theme.gradientFrom}40 0%, transparent 24%)`,
          }}
        />

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
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
        <div className="mb-2.5 flex-1 min-h-[5.5rem] flex flex-col">
          <h3 className="font-heading font-black text-gray-900 text-[13px] sm:text-sm leading-tight line-clamp-1 group-hover/dish:text-[var(--tw-ring-color)] transition-colors mb-1">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="px-2 py-0.5 rounded-full bg-amber-50" style={{ color: theme.accent }}>{category || "Dish"}</span>
            {restaurantName && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                <span className="line-clamp-1">{restaurantName}</span>
              </>
            )}
          </div>
        <div className="mt-1.5 min-h-[2rem]">
            {isBlocked ? (
              <p className="text-[10px] leading-snug text-amber-700 line-clamp-2">
                This restaurant is not currently accepting orders.
              </p>
            ) : (
              <p className="text-[10px] leading-snug text-transparent select-none">
                This restaurant is not currently accepting orders.
              </p>
            )}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!isBlocked) {
              addItem({
                menuItemId: id,
                name,
                price,
                imageUrl: imageUrl || "",
                restaurantId: "restaurantId" in dish ? dish.restaurantId : id,
                restaurantName: restaurantName || "Restaurant",
                restaurantLocation: "restaurantLocation" in dish && dish.restaurantLocation ? dish.restaurantLocation : site.location,
                openingHours,
              });
            } else {
              toast.error("This restaurant is not currently accepting orders.");
            }
          }}
          className={`w-full mt-auto flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${isBlocked ? "bg-white text-gray-400 border border-dashed border-gray-200 cursor-not-allowed" : "text-white shadow-sm hover:opacity-90 active:scale-95"}`}
          style={!isBlocked ? { background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` } : {}}
          disabled={isBlocked}
        >
          <ShoppingCart className="w-3 h-3" />
          {isBlocked ? "Not accepting orders" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export function SkeletonDishCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse flex flex-col">
      <div className="h-40 sm:h-44 bg-gray-100" />
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="h-4 sm:h-5 w-3/4 bg-gray-200 rounded-lg mb-2.5" />
          <div className="h-3 w-1/2 bg-gray-100 rounded-lg mb-3" />
          <div className="space-y-2">
             <div className="h-2.5 w-full bg-gray-100 rounded" />
             <div className="h-2.5 w-4/5 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="pt-3 border-t border-gray-50 flex justify-between items-center mt-auto">
          <div className="h-3 w-20 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
