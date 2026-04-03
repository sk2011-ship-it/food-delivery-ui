"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Clock, Truck, Minus, Plus, Leaf, Store } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getMenu } from "@/data/menus";
import type { Restaurant } from "@/data/restaurants";
import type { AdminMenuItemResponse } from "@/lib/api";

interface RestaurantMenuViewProps {
  restaurant: any; // Allow flexible restaurant data
  initialMenuItems?: AdminMenuItemResponse[];
}

export default function RestaurantMenuView({ 
  restaurant, 
  initialMenuItems 
}: RestaurantMenuViewProps) {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const [cart, setCart] = useState<Record<string, number>>({});

  // 1. Determine the menu source (DB vs Mock)
  const menu = useMemo(() => {
    if (initialMenuItems && initialMenuItems.length > 0) {
      // Transform DB items into categorized sections
      const categories = Array.from(new Set(initialMenuItems.map(m => m.category)));
      return categories.map(cat => ({
        category: cat,
        emoji: "🍽️", // Default emoji for DB items
        items: initialMenuItems.filter(m => m.category === cat).map(item => ({
          ...item,
          // DB price is a number or string (numeric), mock price is a string like "£10"
          price: (function() {
            const p = item.price as any;
            if (typeof p === "number") return `£${p.toFixed(2)}`;
            if (typeof p === "string") {
              if (p.startsWith("£")) return p;
              const val = parseFloat(p);
              return !isNaN(val) ? `£${val.toFixed(2)}` : p;
            }
            return p;
          })(),
          veg: false, // Not in DB yet
          popular: false, // Not in DB yet
        }))
      }));
    }
    return getMenu(restaurant.id);
  }, [restaurant.id, initialMenuItems]);

  const [activeTab, setActiveTab] = useState(menu[0]?.category ?? "");
  const activeSection = menu.find((s) => s.category === activeTab);

  const addItem = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((c) => {
      const next = { ...c, [id]: (c[id] ?? 1) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (menu.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100 my-10">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
           <Store className="w-10 h-10 text-gray-200" />
        </div>
        <h2 className="font-black text-2xl text-gray-900 mb-2">
          Menu coming soon
        </h2>
        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8">
          {restaurant.name} is currently preparing their menu. Please check back later!
        </p>
        <Link
          href="/dashboard/customer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-transform hover:scale-105"
          style={{ background: accent }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* ── Restaurant hero ── */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {restaurant.image ? (
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <Store className="w-20 h-20 text-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/dashboard/customer"
          className="absolute top-6 left-6 flex items-center gap-1.5 bg-white backdrop-blur-md text-gray-900 text-xs font-black px-4 py-2.5 rounded-full shadow-xl hover:bg-gray-50 transition-all z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Info overlay */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading font-black text-white text-3xl sm:text-4xl leading-tight drop-shadow-md">
              {restaurant.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {restaurant.cuisine && (
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white text-gray-900 shadow-sm">
                  {restaurant.cuisine}
                </span>
              )}
              
              {restaurant.rating !== undefined && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {restaurant.rating} {restaurant.reviews !== undefined && `(${restaurant.reviews})`}
                </span>
              )}

              {restaurant.deliveryTime && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5" />
                  {restaurant.deliveryTime}
                </span>
              )}

              {restaurant.deliveryFee && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                  <Truck className="w-3.5 h-3.5" />
                  {restaurant.deliveryFee}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 py-8">
        {/* Category tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-8">
          {menu.map((section) => (
            <button
              key={section.category}
              onClick={() => {
                setActiveTab(section.category);
              }}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-tighter transition-all shadow-sm border border-transparent"
              style={
                activeTab === section.category
                  ? { background: `linear-gradient(135deg, ${gradientFrom}, ${accent})`, color: "#fff" }
                  : { background: "#fff", color: "gray", border: "1px solid #f3f4f6" }
              }
            >
              <span>{section.emoji}</span>
              {section.category}
            </button>
          ))}
        </div>

        {/* Menu items */}
        {activeSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSection.items.map((item) => {
              const qty = cart[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0 bg-gray-50 border border-gray-50 overflow-hidden relative"
                  >
                    {"imageUrl" in item && item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      activeSection.emoji
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-gray-900 truncate">
                          {item.name}
                        </h3>
                        {item.veg && (
                          <Leaf className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-black" style={{ color: accent }}>
                        {item.price}
                      </p>

                      {qty === 0 ? (
                        <button
                          onClick={() => addItem(item.id)}
                          className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-transform hover:scale-105 active:scale-95"
                        >
                          Add to order
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-100 transition-colors hover:bg-gray-50"
                          >
                            <Minus className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <span className="text-sm font-black text-gray-900 w-4 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => addItem(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
                            style={{ background: accent }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sticky cart bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Link
            href="/dashboard/customer/cart"
            className="flex items-center justify-between w-full px-6 py-4 rounded-3xl shadow-2xl text-white font-black transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                {cartCount}
              </div>
              <span className="uppercase tracking-widest text-xs">View your order</span>
            </div>
            <span className="text-sm border-l border-white/20 pl-4 ml-4">
              {cartCount} items
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
