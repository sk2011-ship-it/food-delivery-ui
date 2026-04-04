"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import {
  ShoppingBag, Clock, CheckCircle2, CreditCard,
  Package, Truck, AlertCircle, Store
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; hex: string; description: string }
> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    hex: "#F59E0B",
    description: "Waiting for restaurant to confirm...",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-green-50 text-green-700 border-green-200",
    hex: "#22C55E",
    description: "Restaurant confirmed — proceed with payment.",
  },
  PAID: {
    label: "Paid",
    icon: CreditCard,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    hex: "#3B82F6",
    description: "Payment received — preparing your food.",
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    hex: "#A855F7",
    description: "Chef is working on your meal!",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    hex: "#F97316",
    description: "Your food is on the way!",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hex: "#10B981",
    description: "Enjoy your meal! 🎉",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "bg-red-50 text-red-700 border-red-200",
    hex: "#EF4444",
    description: "This order was cancelled.",
  },
};

export default function CustomerOrdersPage() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching orders...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-gray-900">My Orders</h1>
        <p className="text-xs text-gray-400 mt-0.5">Track your meals in real-time.</p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-xl border-2 border-dashed border-gray-100 shadow-sm">
          <ShoppingBag className="w-10 h-10 mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No orders yet</p>
          <p className="text-xs text-gray-400 mt-0.5">Hungry? Order something delicious!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING_CONFIRMATION;
            const Icon = config.icon;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* thin status bar */}
                <div
                  className="h-0.5 w-full"
                  style={{ backgroundColor: config.hex }}
                />

                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.hex}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: config.hex }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            #{order.id?.slice(0, 8)}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3 text-gray-400" />
                          {order.restaurant?.name || "Restaurant"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status description */}
                  <p className="text-xs text-gray-500 mb-3">{config.description}</p>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
                    <div className="space-y-1.5">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium">
                            <span className="text-gray-400 mr-1.5">{item.quantity}×</span>
                            {item.menuItem?.name || "Item"}
                          </span>
                          <span className="text-gray-400 font-semibold">
                            £{parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Total
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() =>
                        updateOrderStatus(order.id, "PAID", "pi_mock_" + Date.now())
                      }
                      className="w-full py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.01] active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${gradientFrom}, ${accent})`,
                      }}
                    >
                      Process Payment
                    </button>
                  )}

                  {order.status === "PAID" && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-blue-50 rounded-lg border border-blue-100">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                        Payment Secured
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
