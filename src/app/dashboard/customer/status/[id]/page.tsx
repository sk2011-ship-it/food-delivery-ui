"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ChevronLeft,
  ShoppingBag,
  Store,
  CreditCard,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Timer } from "lucide-react";
import { useOrderTimer } from "@/hooks/useOrderTimer";
import { useAuthStore } from "@/store/useAuthStore";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; description: string; step: number }> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "#EAB308", // Yellow
    description: "Waiting for restaurant to confirm your order...",
    step: 1
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "#22C55E", // Green
    description: "Restaurant confirmed! Please proceed with payment.",
    step: 2
  },
  PAID: {
    label: "Paid & Preparing",
    icon: CreditCard,
    color: "#3B82F6", // Blue
    description: "Payment successful. Preparing your food...",
    step: 3
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "#A855F7", // Purple
    description: "Chef is working on your meal!",
    step: 3
  },
  DISPATCH_REQUESTED: {
    label: "Dispatch Requested",
    icon: Truck,
    color: "#FB923C",
    description: "We're arranging your rider now.",
    step: 4
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "#F97316", // Orange
    description: "Your food is on the way!",
    step: 4
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "#10B981", // Emerald
    description: "Enjoy your meal!",
    step: 5
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "#EF4444", // Red
    description: "This order was cancelled.",
    step: 0
  },
};

export default function OrderStatusPage() {
  const { id } = useParams();
  const { orders, loading, refreshOrders, updateOrderStatus } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const [isPaying, setIsPaying] = React.useState(false);

  const order = orders.find(o => o.id === id);

  const handleExpire = async () => {
    if (!order || order.status !== "PENDING_CONFIRMATION") return;
    try {
      await updateOrderStatus(order.id, "CANCELLED");
      toast.error("Your order was cancelled because the restaurant didn't respond in time. No charges were made.", {
        duration: 5000,
      });
    } catch (err) {
      console.error("[handleExpire]", err);
    }
  };

  const { formattedTime, isExpired } = useOrderTimer(
    order?.createdAt || new Date().toISOString(),
    10,
    handleExpire
  );

  const IS_TERMINAL = order?.status === "DELIVERED" || order?.status === "CANCELLED";

  const handlePayment = async () => {
    if (!order) return;

    try {
      setIsPaying(true);
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${order.id}/stripe/session`, {
        method: "POST",
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
      });
      const data = await res.json();

      const sessionUrl = data.url || data.data?.url;

      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        toast.error(data.message || data.error || "Failed to initialize payment session");
      }
    } catch (err) {
      console.error("[handlePayment]", err);
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };


  const config = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_CONFIRMATION) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30 font-black text-gray-400 uppercase tracking-widest text-xs">
        Locating Order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 space-y-6 text-center">
        <AlertCircle className="w-16 h-16 text-gray-200" />
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Order Not Found</h1>
        <p className="text-sm font-medium text-gray-400 max-w-xs leading-relaxed">
          We couldn't find the order you're looking for. It might be archived or incorrect.
        </p>
        <Link href="/dashboard/customer/orders" className="text-xs font-black uppercase tracking-widest text-blue-500 hover:scale-105 transition-all">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Minimal Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/dashboard/customer/orders"
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <h1 className="text-xl font-heading font-bold text-gray-900">Track Order</h1>
        </div>

        {/* Hero ETA Section - Swiggy/Zomato Style */}
        <div className="mb-12 border-b border-gray-100 pb-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
              <h2 className="text-4xl font-heading font-black text-gray-900 tracking-tight">25 - 40 <span className="text-xl">mins</span></h2>
            </div>
            <div className="flex flex-col items-end">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-sans font-black uppercase tracking-widest"
                style={{ backgroundColor: `${config?.color}15`, color: config?.color }}
              >
                {config?.label}
              </span>
              <p className="text-[10px] font-sans font-semibold text-gray-400 mt-2">ID: #{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <p className="text-sm font-sans font-medium text-gray-500 leading-relaxed max-w-lg">
            {config?.description}
          </p>
        </div>

        {/* Vertical Timeline Tracker */}
        <div className="space-y-0 mb-12">
          {[
            { id: "PENDING_CONFIRMATION", label: "Order Placed", step: 1, icon: Clock },
            { id: "CONFIRMED", label: "Order Confirmed", step: 2, icon: CheckCircle2 },
            { id: "PAID", label: "Paid & Preparing", step: 3, icon: CreditCard },
            { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", step: 4, icon: Truck },
            { id: "DELIVERED", label: "Delivered", step: 5, icon: CheckCircle2 },
          ].map((item, index, arr) => {
            const isCompleted = (config?.step || 0) > item.step || (config?.step === 5 && item.step === 5);
            const isActive = (config?.step || 0) === item.step && !isCompleted;
            const isLast = index === arr.length - 1;

            return (
              <div key={item.id} className="flex gap-6 min-h-[80px]">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isCompleted ? 'bg-green-500 border-green-500' :
                      isActive ? `border-${config?.color} bg-white animate-pulse` :
                        'bg-white border-gray-100'
                      }`}
                    style={{ borderColor: isActive ? config?.color : undefined }}
                  >
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 my-1 transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'
                        }`}
                    />
                  )}
                </div>
                <div className="pb-8 pt-0.5">
                  <p className={`text-sm font-sans font-bold ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-300'}`}>
                    {item.label}
                  </p>
                  {isActive && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      {/* Contextual Action Button integrated into timeline */}
                      {order.status === "CONFIRMED" && (
                        <button
                          onClick={handlePayment}
                          disabled={isPaying}
                          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-sans font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isPaying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                          {isPaying ? "Processing..." : `Pay £${parseFloat(order.totalAmount).toFixed(2)} Now`}
                        </button>
                      )}

                      {order.status === "PENDING_CONFIRMATION" && !isExpired && (
                        <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          <Timer className="w-3 h-3" />
                          <span className="text-[11px] font-sans font-bold tabular-nums">{formattedTime}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items Section - Minimal List */}
        <div className="pt-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Your Order From</p>
              <h3 className="text-lg font-heading font-bold text-gray-900">{order.restaurant?.name || "Restaurant"}</h3>
            </div>
            <Link href={`/dashboard/customer/restaurant/${order.restaurantId}`} className="text-xs font-sans font-bold text-blue-500">View Menu</Link>
          </div>

          <div className="space-y-6 mb-10">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-50 rounded flex items-center justify-center text-[10px] font-sans font-bold text-gray-400">
                    {item.quantity}
                  </span>
                  <div>
                    <p className="text-sm font-sans font-bold text-gray-800">{item.menuItem?.name}</p>
                    <p className="text-[10px] font-sans text-gray-400 font-medium">Standard Preparation</p>
                  </div>
                </div>
                <span className="text-sm font-sans font-bold text-gray-900">£{parseFloat(item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div className="bg-gray-50/50 rounded-2xl p-6 space-y-3 border border-gray-100/50">
            <div className="flex justify-between text-xs font-sans font-medium text-gray-500">
              <span>Item Total</span>
              <span>£{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-sans font-medium text-gray-400">
              <span>Delivery Fee</span>
              <span>{parseFloat(order.deliveryFee || "0") > 0 ? `£${parseFloat(order.deliveryFee).toFixed(2)}` : 'FREE'}</span>
            </div>
            <div className="h-px bg-gray-200/50 my-2" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-sans font-bold text-gray-900">Total Charged</span>
              <span className="text-xl font-heading font-black text-gray-900 tracking-tight">£{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <button className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group">
            <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Need help with this order?</span>
          </button>

          <p className="text-[9px] font-sans font-semibold text-gray-300 uppercase tracking-[0.3em] text-center">
            Powered by {site.name} Delivery
          </p>
        </div>
      </div>
    </div>
  );
}
