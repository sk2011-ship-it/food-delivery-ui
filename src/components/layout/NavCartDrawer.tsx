"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { X, ShoppingBag, Plus, Minus, ChevronRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { useCart } from "@/context/CartContext";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavCartDrawer({ isOpen, onClose }: Props) {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const { currentCartItems, totalItems, totalPrice, updateQuantity } = useCart();
  const { session } = useAuthStore();
  const router = useRouter();
  const isLoggedIn = !!session;

  const drawerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-[61] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}10, ${accent}10)` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">My Cart</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {currentCartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-16">
              <div
                className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center"
                style={{ background: `${gradientFrom}12` }}
              >
                <ShoppingBag className="w-9 h-9" style={{ color: gradientFrom }} />
              </div>
              <div>
                <p className="text-base font-black text-gray-800">Your cart is empty</p>
                <p className="text-xs text-gray-400 font-medium mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Add items from a restaurant to get started
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  router.push("/dashboard/customer");
                }}
                className="px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <>
              {/* Cart items */}
              {currentCartItems.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border transition-all border-gray-100 bg-white hover:shadow-sm"
                  >
                    {/* Image */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 truncate">{item.restaurantName}</p>
                      <p className="text-xs font-black mt-0.5" style={{ color: accent }}>
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 bg-gray-50 p-0.5 rounded-full border border-gray-100">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-white border border-gray-100 text-gray-500 hover:text-gray-900 shadow-sm transition-all"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-black text-gray-900 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                        style={{ background: accent }}
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer — only when cart has items */}
        {currentCartItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-white">
            {/* Totals */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Total</span>
              <span className="text-lg font-black" style={{ color: gradientFrom }}>
                £{totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Guest prompt */}
            {!isLoggedIn && (
              <p className="text-[11px] text-center text-gray-400 font-medium leading-relaxed">
                Sign in to place your order — your cart will be saved automatically.
              </p>
            )}

            {/* CTA */}
            {!isLoggedIn ? (
              <Link
                href="/login?redirect=/dashboard/customer/cart"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                Sign in to Checkout
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard/customer/checkout"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                Checkout Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

      </div>
    </>,
    document.body
  );
}
