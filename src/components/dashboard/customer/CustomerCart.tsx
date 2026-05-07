"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, ArrowRight, Minus, Plus, Trash2,
  Store, MapPin, AlertTriangle, Sparkles, ChevronRight, Loader2
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSite } from "@/context/SiteContext";
import { useCart } from "@/context/CartContext";
import { useConfigStore } from "@/store/useConfigStore";
import { useAuthStore } from "@/store/useAuthStore";
import LocationPermissionModal from "@/components/shared/LocationPermissionModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";
import { featuredApi, type PublicFeaturedDish } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

export default function CustomerCart() {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const { currentCartItems, totalItems, totalPrice, updateQuantity, removeItem, clearCart, loading } = useCart();
  const isEmpty = currentCartItems.length === 0;
  const { session } = useAuthStore();
  const isLoggedIn = !!session;
  const { userCoords } = useConfigStore();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (userCoords || !navigator.geolocation) return;

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            useConfigStore.getState().setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => { }
        );
      } else if (result.state === "prompt") {
        const t = setTimeout(() => setLocationModalOpen(true), 600);
        return () => clearTimeout(t);
      }
    }).catch(() => {
      const t = setTimeout(() => setLocationModalOpen(true), 600);
      return () => clearTimeout(t);
    });
  }, []);

  const [featuredDishes, setFeaturedDishes] = useState<PublicFeaturedDish[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    setFeaturedLoading(true);
    featuredApi.listDishes(site.location).then((res) => {
      if (res.success && res.data) {
        setFeaturedDishes(res.data.items.slice(0, 3));
      }
      setFeaturedLoading(false);
    });
  }, [site.location]);

  const groupedItems = React.useMemo(() => {
    return currentCartItems.reduce((acc, item) => {
      const g = acc[item.restaurantId] || {
        name: item.restaurantName,
        items: [],
        isOpen: isRestaurantOpen(item.openingHours)
      };
      g.items.push(item);
      acc[item.restaurantId] = g;
      return acc;
    }, {} as Record<string, { name: string; items: typeof currentCartItems; isOpen: boolean }>);
  }, [currentCartItems]);

  const handleCheckout = () => {
    router.push("/dashboard/customer/checkout");
  };

  const hasClosedRestaurants = Object.values(groupedItems).some(g => !g.isOpen);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-100 rounded-lg mx-auto" />
          <div className="h-4 w-48 bg-gray-50 rounded-lg mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-32 px-4">
      {/* Page header */}
      <div className="flex items-end justify-between pt-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-heading">
            Your Cart
          </h1>
          <p className="text-[11px] font-medium text-gray-400 mt-1 flex items-center gap-2">
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''} in total</span>
            {site.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {site.location}</span>}
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setShowClearModal(true)}
            className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-all flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear items
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-8 text-center py-24">
          <div
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center p-6 bg-gray-50"
          >
            <ShoppingBag className="w-full h-full text-gray-200" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 font-heading">
              Your basket is empty
            </h2>
            <p className="text-sm text-gray-400 max-w-[240px] mx-auto leading-relaxed">
              Explore best restaurants around you and add something delicious!
            </p>
          </div>

          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Browse restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {hasClosedRestaurants && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100/50">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase tracking-tight">
                Some restaurants in your cart are currently closed. Please remove their items to proceed.
              </p>
            </div>
          )}

          {/* Unified List Surface */}
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([rid, group]) => {
              return (
                <div key={rid} className="space-y-4">
                  {/* Restaurant Info */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Store className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        {group.name}
                      </span>
                      {!group.isOpen && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded">Currently Closed</span>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    {group.items.map((item) => {
                      return (
                        <div key={item.id} className="py-4 flex gap-6 transition-all">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shrink-0 border border-gray-100">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <ShoppingBag className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-gray-900">£{item.price.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-center">
                            <div className="flex items-center gap-3 h-10 px-1 rounded-full border border-gray-100 bg-gray-50/30">
                              <button
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-900 shadow-sm transition-all"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-bold text-gray-900 tabular-nums w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                                style={{ background: accent }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Integrated Summary Section */}
          <div className="pt-6 space-y-6">
            <div className="space-y-3 px-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-400">Items Subtotal</span>
                <span className="font-bold text-gray-900">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-400">Delivery Fee</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Calculated at checkout</span>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900 font-heading">Amount Payable</span>
                <span className="text-2xl font-black" style={{ color: accent }}>£{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4">
              {!isLoggedIn ? (
                <Link
                  href="/login?redirect=/dashboard/customer/cart"
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                >
                  Log in to Continue
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : !userCoords ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-tight">Enable location for delivery fees</span>
                  </div>
                  <button
                    onClick={() => setLocationModalOpen(true)}
                    className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                  >
                    Enable Access
                  </button>
                </div>
              ) : hasClosedRestaurants ? (
                <button
                  disabled
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-gray-100 text-red-400 cursor-not-allowed border border-red-100"
                >
                  Closed restaurants in cart
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:opacity-90 hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                >
                  {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Proceed to Checkout"}
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <LocationPermissionModal
        site={site}
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        isMandatory={!userCoords}
      />

      {/* Suggested Items Section */}
      {(featuredLoading || featuredDishes.length > 0) && (
        <div className="space-y-6 pt-10 border-t border-gray-100">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-gray-900 font-heading">Complete your meal</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredLoading
              ? [1, 2, 3].map((n) => <SkeletonDishCard key={n} />)
              : featuredDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} theme={site.theme} />
              ))
            }
            <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          clearCart();
          setShowClearModal(false);
        }}
        title="Clear Cart?"
        message="Are you sure you want to clear all items from your cart?"
        confirmText="Clear Everything"
        danger={true}
      />
    </div>
        </div>
      )}
    </div>
  );
}
