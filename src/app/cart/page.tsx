"use client";

import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import { restaurantService } from "@/services/api";
import { MenuItem } from "@/types/restaurant";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    const hasUnavailable = items.some(i => i.is_available === false);
    if (hasUnavailable) {
      toast.error("Some items are no longer available. Please remove them to continue.");
      return;
    }

    try {
      setCheckingOut(true);
      const data = await restaurantService.createCheckoutSession(items, totalPrice);

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "An error occurred during checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || role !== 'customer')) {
      router.push("/");
    }
  }, [user, role, authLoading, router]);

  // Sync cart items availability with server
  useEffect(() => {
    const syncAvailability = async () => {
      if (items.length === 0) return;

      // Group items by restaurant to minimize API calls
      const restaurantIds = Array.from(new Set(items.map(i => i.restaurant_id).filter(Boolean)));

      for (const restaurantId of restaurantIds) {
        try {
          // Using getPublicRestaurantById to get the menu items
          const restaurantData = await restaurantService.getPublicRestaurantById(restaurantId as string);

          if (restaurantData.menu_items) {
            // Find items that are no longer in the menu
            items.forEach(item => {
              if (item.restaurant_id === restaurantId) {
                const latest = restaurantData.menu_items.find((m: MenuItem) => m.id === item.id);
                if (latest) {
                  // Sync availability
                  if (latest.is_available !== item.is_available) {
                    updateQuantity(item.id, 0, latest);
                  }
                } else {
                  // Item no longer in menu - REMOVE IT
                  removeItem(item.id);
                  toast.error(`"${item.name}" is no longer available and has been removed from your bag`);
                }
              }
            });
          }
        } catch (err) {
          console.error(`Failed to sync availability for restaurant ${restaurantId}`, err);
          // If the restaurant is missing (fetch failed), remove ALL its items
          const itemsToRemove = items.filter(i => i.restaurant_id === restaurantId);
          if (itemsToRemove.length > 0) {
            itemsToRemove.forEach(i => removeItem(i.id));
            toast.error("A restaurant in your bag is no longer available");
          }
        }
      }
    };

    syncAvailability();
  }, [items.length]); // Re-sync if item count changes

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!user || role !== 'customer') {
    return null; // Will redirect via useEffect
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-8">
        <div className="w-32 h-32 bg-orange-50 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner">
          <ShoppingBag className="h-16 w-16 text-orange-200" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Your bag is empty</h2>
        <p className="text-slate-400 font-bold mb-10 max-w-sm text-center leading-relaxed italic">
          "The early bird catches the worm, but the hungry human catches the tacos." - Add some food!
        </p>
        <Link href="/restaurants">
          <Button className="bg-orange-600 hover:bg-orange-700 h-16 px-10 text-xl font-black rounded-[2rem] shadow-xl shadow-orange-100 transition-all active:scale-95 cursor-pointer">
            Start Exploring
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link href="/restaurants" className="inline-flex items-center gap-2 text-orange-600 font-black hover:text-orange-700 transition-colors uppercase tracking-widest text-xs">
              <ArrowLeft className="w-4 h-4" /> Keep Browsing
            </Link>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">Your Bag</h1>
          </div>
          <div className="bg-white px-8 py-4 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center gap-6 border-none">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total Bill</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">${totalPrice.toFixed(2)}</p>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div className="bg-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-100">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
                <CardContent className="p-8 flex items-center gap-8">
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <div className="absolute inset-0 bg-slate-100 rounded-[1.5rem] overflow-hidden">
                      <Image
                        src={item.image_url || ""}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-2xl text-slate-900 truncate mb-1">
                        {item.name}
                      </h3>

                      {item.is_available === false && (
                        <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    <p className="text-orange-600 text-lg font-black tracking-tight">${item.price.toFixed(2)} each</p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                      <button
                        onClick={() => {
                          if (item.is_available === false) {
                            toast.error("This item is currently sold out");
                            return;
                          }
                          updateQuantity(item.id, -1);
                        }}
                        disabled={item.is_available === false}
                        className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-slate-400 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-black text-slate-900 text-xl w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => {
                          if (item.is_available === false) {
                            toast.error("This item is currently sold out");
                            return;
                          }
                          updateQuantity(item.id, 1);
                        }}
                        disabled={item.is_available === false}
                        className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-slate-400 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white p-10 space-y-10 sticky top-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <div className="space-y-2 relative z-10">
                <h3 className="text-3xl font-black uppercase tracking-tight">Order Details</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ready for fulfillment</p>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>Subtotal Items</span>
                  <span className="text-white">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>Delivery Fee</span>
                  <span className="text-green-400 font-black">COMPLIMENTARY</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Grand Total</p>
                    <p className="text-5xl font-black text-white tracking-tighter">${totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-20 text-xl font-black rounded-[2rem] shadow-2xl shadow-orange-900/20 transition-all active:scale-95 group relative z-10 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Place Order <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
