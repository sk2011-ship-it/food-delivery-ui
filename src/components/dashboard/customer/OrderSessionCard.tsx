"use client";

import React from "react";
import {
  Clock, CreditCard, ChevronRight, Loader2, Star,
  ShoppingBag, Truck, Package, AlertCircle, CheckCircle2,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { Order } from "@/types/api.types";

interface OrderSession {
  id: string;
  status: string;
  totalItemsAmount: string;
  totalDeliveryFee: string;
  createdAt: string;
  orders: Order[];
}

interface OrderSessionCardProps {
  session: OrderSession;
  accent: string;
  gradientFrom: string;
  isPaying: boolean;
  onPay: (id: string) => void;
  onTrack: (subOrderId: string) => void;
  onRate?: (order: Order) => void;
}

interface StatusConfig {
  label: string;
  color: string;
  bg?: string;
  hex?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SESSION_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { label: "Confirming", color: "text-amber-700", bg: "bg-amber-50", hex: "#F59E0B", icon: Clock },
  READY_TO_PAY: { label: "Accepted - Ready to Pay", color: "text-green-700", bg: "bg-green-50", hex: "#22C55E", icon: CheckCircle2 },
  PAID: { label: "Paid", color: "text-blue-700", bg: "bg-blue-50", hex: "#3B82F6", icon: CreditCard },
  CANCELLED: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", hex: "#EF4444", icon: AlertCircle },
};

const SUB_ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_CONFIRMATION: { label: "Confirming", color: "text-amber-500", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "text-green-600", icon: CheckCircle2 },
  PAID: { label: "Paid", color: "text-blue-600", icon: CreditCard },
  CANCELLED: { label: "Cancelled", color: "text-red-400", icon: AlertCircle },
  PREPARING: { label: "Preparing", color: "text-purple-600", icon: Package },
  DISPATCH_REQUESTED: { label: "Dispatching", color: "text-orange-500", icon: Truck },
  OUT_FOR_DELIVERY: { label: "On the Way", color: "text-orange-600", icon: Truck },
  DELIVERED: { label: "Delivered", color: "text-emerald-600", icon: CheckCircle2 },
};

export default function OrderSessionCard({
  session,
  accent,
  gradientFrom,
  isPaying,
  onPay,
  onTrack,
  onRate
}: OrderSessionCardProps) {
  const config = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.PENDING;

  const date = new Date(session.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const sessionItemsAmount = Number.parseFloat(session.totalItemsAmount || "0");
  const sessionDeliveryFee = Number.parseFloat(session.totalDeliveryFee || "0");
  const sessionTotalAmount = sessionItemsAmount + sessionDeliveryFee;
  const derivedTotalAmount = session.orders.reduce((sum, order) => {
    const itemTotal = Number.parseFloat(order.totalAmount || "0");
    const deliveryTotal = Number.parseFloat(order.deliveryFee || "0");
    return sum + itemTotal + deliveryTotal;
  }, 0);
  const totalAmount = sessionTotalAmount > 0 ? sessionTotalAmount : derivedTotalAmount;
  const restaurantCount = session.orders.length;
  const itemCount = session.orders.reduce((sum, order) => {
    return sum + ((order.items || []).reduce((itemSum: number, item: { quantity?: number }) => itemSum + (item.quantity || 0), 0));
  }, 0);
  const sessionDescription =
      session.status === "READY_TO_PAY"
      ? "Everything is confirmed. Complete payment to lock it in."
      : session.status === "PAID"
        ? "Paid successfully. We'll keep you updated as each kitchen progresses."
        : session.status === "CANCELLED"
          ? "This order could not be completed."
          : "We're checking with the restaurant and lining everything up.";
  const sessionTitle = restaurantCount > 1 ? "Group Order" : "Order Session";

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md group">
      <div className="p-4 sm:p-5">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 border border-gray-50 shadow-sm transition-transform group-hover:scale-105"
              style={{ background: `${config.hex}10` }}
            >
              <Store className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: config.hex }} />
            </div>

            <div className="min-w-0">
              <h3 className="font-heading font-bold text-gray-900 text-base sm:text-lg truncate leading-tight group-hover:text-gray-950">
                {sessionTitle}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 flex items-center gap-2 font-medium">
                <span>{date}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>Session ID: {session.id.slice(-6).toUpperCase()}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5",
                    config.bg, config.color
                  )}
                >
                  <config.icon className="w-3 h-3" />
                  {config.label}
                </span>
                <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 uppercase tracking-tight">
                  {restaurantCount} Restaurants
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-3 sm:pt-0">
            <p className="font-heading font-black text-gray-900 text-lg sm:text-xl tracking-tight">
              £{totalAmount.toFixed(2)}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{itemCount} Items</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-gray-500 mt-3.5 leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-50 italic">
          {sessionDescription}
        </p>

        {/* Sub-orders Grid */}
        <div className="mt-5 space-y-2.5">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-1">Detailed Breakdown</p>
          <div className="grid grid-cols-1 gap-3">
            {session.orders.map((order) => {
              const subConfig = SUB_ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-400", icon: Clock };
              const StatusIcon = subConfig.icon;
              const orderTotalAmount =
                Number.parseFloat(order.totalAmount || "0") + Number.parseFloat(order.deliveryFee || "0");
              const isDelivered = order.status === "DELIVERED";
              
              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-gray-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-gray-800 truncate">{order.restaurant?.name || "Restaurant"}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                        {order.items?.length || 0} items · £{orderTotalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                      <StatusIcon className={cn("w-2.5 h-2.5", subConfig.color)} />
                      <span className={cn("text-[9px] font-bold uppercase tracking-wide", subConfig.color)}>{subConfig.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDelivered && onRate && !order.review && (
                        <button
                          onClick={() => onRate(order)}
                          className="p-1.5 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                          title="Rate Order"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                        </button>
                      )}
                      <button 
                        onClick={() => onTrack(order.id)}
                        className="px-2.5 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                      >
                        Track <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Session Actions */}
        {(session.status === "READY_TO_PAY" || session.status === "PAID") && (
          <div className="mt-6 pt-6 border-t border-gray-50">
            {session.status === "READY_TO_PAY" && (
              <button
                onClick={() => onPay(session.id)}
                disabled={isPaying}
                className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {isPaying ? "Initialising..." : `Complete Payment · £${totalAmount.toFixed(2)}`}
              </button>
            )}

            {session.status === "PAID" && (
              <div className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 flex items-center justify-center gap-3 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
                Session Paid & Confirmed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
