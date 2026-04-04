"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import { ShoppingBag, Clock, CheckCircle2, CreditCard, Package, Truck, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; description: string }> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "#EAB308", // Yellow
    description: "Waiting for restaurant to confirm your order...",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "#22C55E", // Green
    description: "Restaurant confirmed! Please proceed with payment.",
  },
  PAID: {
    label: "Paid",
    icon: CreditCard,
    color: "#3B82F6", // Blue
    description: "Payment successful. Preparing your food...",
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "#A855F7", // Purple
    description: "Chef is working on your meal!",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "#F97316", // Orange
    description: "Your food is on the way!",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "#10B981", // Emerald
    description: "Enjoy your meal!",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "#EF4444", // Red
    description: "This order was cancelled.",
  },
};

export default function CustomerOrdersPage() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;

  if (loading) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
          My Orders
        </h1>
        <p className="text-sm font-medium opacity-50" style={{ color: "var(--dash-text-secondary)" }}>
          Track your delicious meals in real-time
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold">No orders found yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_CONFIRMATION;
            const Icon = config.icon;

            return (
              <div 
                key={order.id}
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="w-8 h-8" style={{ color: config.color }} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md bg-gray-100 text-gray-500">
                      ID: {order.id.slice(0, 8)}
                    </span>
                    <span 
                      className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md"
                      style={{ backgroundColor: `${config.color}20`, color: config.color }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">
                    Order Total: £{parseFloat(order.totalAmount).toFixed(2)}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {config.description}
                  </p>
                </div>

                <div className="w-full md:w-auto">
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "PAID", "pi_mock_" + Date.now())}
                      className="w-full md:w-auto px-8 py-3 rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                    >
                      Pay Now
                    </button>
                  )}
                  {order.status === "PAID" && (
                    <div className="text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-lg">
                      Payment Received
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
