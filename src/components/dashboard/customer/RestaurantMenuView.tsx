"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Clock, Truck, Minus, Plus, Leaf, Flame } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getMenu } from "@/data/menus";
import type { Restaurant } from "@/data/restaurants";

export default function RestaurantMenuView({ restaurant }: { restaurant: Restaurant }) {
  const { site } = useSite();
  const menu = getMenu(restaurant.id);
  const [activeTab, setActiveTab] = useState(menu[0]?.category ?? "");
  const [cart, setCart] = useState<Record<string, number>>({});

  const { gradientFrom, accent } = site.theme;

  const addItem   = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((c) => {
      const next = { ...c, [id]: (c[id] ?? 1) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const activeSection = menu.find((s) => s.category === activeTab);

  if (menu.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-5xl mb-4">🍽️</p>
        <h2 className="font-bold text-lg" style={{ color: "var(--dash-text-primary)" }}>
          Menu coming soon
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--dash-text-secondary)" }}>
          {restaurant.name} is still setting up their menu.
        </p>
        <Link
          href="/dashboard/customer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: accent }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Restaurant hero ── */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/dashboard/customer"
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-2 rounded-full shadow hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-heading font-black text-white text-2xl sm:text-3xl leading-tight mb-1">
            {restaurant.name}
          </h1>
          <p className="text-white/80 text-sm mb-3" style={{ color: `${accent}` }}>
            {restaurant.cuisine}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {restaurant.rating} ({restaurant.reviews} reviews)
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {restaurant.deliveryTime}
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Truck className="w-3.5 h-3.5" />
              {restaurant.deliveryFee}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 py-6">

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-6">
          {menu.map((section) => (
            <button
              key={section.category}
              onClick={() => setActiveTab(section.category)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
              style={
                activeTab === section.category
                  ? { background: `linear-gradient(135deg, ${gradientFrom}, ${accent})`, color: "#fff" }
                  : { background: "var(--dash-card)", color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }
              }
            >
              <span>{section.emoji}</span>
              {section.category}
            </button>
          ))}
        </div>

        {/* Menu items */}
        {activeSection && (
          <div className="space-y-3">
            {activeSection.items.map((item) => {
              const qty = cart[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-2xl transition-all hover:shadow-sm"
                  style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
                >
                  {/* Emoji placeholder */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${gradientFrom}12` }}
                  >
                    {activeSection.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="text-sm font-bold flex-1" style={{ color: "var(--dash-text-primary)" }}>
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.veg && (
                          <span title="Vegetarian" className="text-green-600">
                            <Leaf className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {item.popular && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${accent}18`, color: accent }}
                          >
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs mt-0.5 mb-2 line-clamp-2" style={{ color: "var(--dash-text-secondary)" }}>
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: "var(--dash-text-primary)" }}>
                        {item.price}
                      </p>

                      {/* Qty control */}
                      {qty === 0 ? (
                        <button
                          onClick={() => addItem(item.id)}
                          className="text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors hover:bg-gray-50"
                            style={{ borderColor: accent }}
                          >
                            <Minus className="w-3 h-3" style={{ color: accent }} />
                          </button>
                          <span className="text-sm font-bold w-5 text-center" style={{ color: "var(--dash-text-primary)" }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => addItem(item.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90"
                            style={{ background: accent }}
                          >
                            <Plus className="w-3 h-3" />
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
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50">
          <Link
            href="/dashboard/customer/cart"
            className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold transition-all hover:opacity-95 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-black"
              >
                {cartCount}
              </span>
              View cart
            </span>
            <span className="text-sm opacity-90">
              {Object.entries(cart)
                .reduce((_total, [_id, _qty]) => _total, 0)}{" "}
              items
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
