"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2, ChevronRight, Store } from "lucide-react";
import React, { useEffect } from "react";
import { useSite } from "@/context/SiteContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export default function CustomerCart() {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const { cartItems, totalItems, totalPrice, updateQuantity, removeItem, clearCart, loading, isGuest, refreshCart } = useCart();
  const [checkingOut, setCheckingOut] = React.useState(false);
  const router = useRouter();

  // Group items by restaurant
  const groupedItems = React.useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const g = acc[item.restaurantId] || { name: item.restaurantName, items: [] };
      g.items.push(item);
      acc[item.restaurantId] = g;
      return acc;
    }, {} as Record<string, { name: string; items: typeof cartItems }>);
  }, [cartItems]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleCheckout = () => {
    router.push("/dashboard/customer/checkout");
  };

  const isEmpty = !loading && cartItems.length === 0;
  const finalTotal = totalPrice;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-gray-100 rounded-lg mx-auto" />
          <div className="h-4 w-48 bg-gray-50 rounded-lg mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Page header */}
      <div className="flex items-end justify-between px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
            My Cart
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-50" style={{ color: "var(--dash-text-secondary)" }}>
            {totalItems} items in your basket
          </p>
        </div>
        {!isEmpty && (
          <button 
            onClick={clearCart}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {isEmpty ? (
        <div
          className="rounded-[2.5rem] p-12 flex flex-col items-center gap-6 text-center shadow-sm"
          style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
        >
          <div
            className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-inner"
            style={{ background: `${gradientFrom}12` }}
          >
            <ShoppingBag className="w-10 h-10" style={{ color: gradientFrom }} />
          </div>

          <div className="space-y-2">
            <p className="text-xl font-black" style={{ color: "var(--dash-text-primary)" }}>
              Your cart is empty
            </p>
            <p className="text-sm max-w-xs mx-auto leading-relaxed font-medium" style={{ color: "var(--dash-text-secondary)" }}>
              Looks like you haven't added anything yet. Explore local restaurants to find your next meal!
            </p>
          </div>

          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Browse Restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cart Items Grouped by Restaurant */}
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([rid, group]) => (
              <div key={rid} className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Store className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {group.name}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex items-center gap-4 p-4 rounded-3xl transition-all hover:shadow-md"
                      style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
                    >
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                             <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-sm font-black text-gray-900 truncate leading-tight mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm font-black" style={{ color: accent }}>
                          £{item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-full border border-gray-100">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-gray-900 shadow-sm transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-gray-900 w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                            style={{ background: accent }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div
            className="rounded-[2.5rem] p-6 space-y-4 shadow-sm"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest opacity-50 px-2" style={{ color: "var(--dash-text-primary)" }}>
              Order Summary
            </h2>
            
            <div className="space-y-2 px-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold opacity-60" style={{ color: "var(--dash-text-secondary)" }}>Subtotal</span>
                <span className="font-black" style={{ color: "var(--dash-text-primary)" }}>£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-50 my-2" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-black" style={{ color: "var(--dash-text-primary)" }}>Total Payable</span>
                <span className="text-xl font-black" style={{ color: accent }}>£{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {isGuest ? (
              <Link
                href="/login?redirect=/dashboard/customer/cart"
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-black/5 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] mt-2"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                Sign in to checkout
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-black/5 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                {checkingOut ? "Placing Orders..." : "Checkout Now"}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

          </div>
        </div>
      )}

      {/* Suggested / popular picks */}
      <div
        className="rounded-[2.5rem] p-6 shadow-sm"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 px-2 opacity-50" style={{ color: "var(--dash-text-primary)" }}>
          Popular additions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { name: "Margherita Pizza", place: "Pizza Palace", price: "£12.99", emoji: "🍕" },
            { name: "Smash Burger",     place: "The Anchor",   price: "£10.50", emoji: "🍔" },
            { name: "Chicken Tikka",   place: "Curry House",  price: "£11.00", emoji: "🍛" },
          ].map((item) => (
            <Link
              key={item.name}
              href="/"
              className="flex flex-col gap-3 p-4 rounded-3xl transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 text-center sm:text-left"
              style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-card-border)" }}
            >
              <span className="text-4xl filter drop-shadow-sm">{item.emoji}</span>
              <div>
                <p className="text-xs font-black leading-tight truncate mb-0.5" style={{ color: "var(--dash-text-primary)" }}>
                  {item.name}
                </p>
                <p className="text-[10px] font-bold opacity-50 truncate" style={{ color: "var(--dash-text-secondary)" }}>
                  {item.place}
                </p>
              </div>
              <p className="text-xs font-black mt-auto" style={{ color: "var(--dash-accent)" }}>
                {item.price}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
