"use client";

import React from "react";
import {
  Clock, CreditCard, ChevronRight, Star, Loader2,
  ShoppingBag, Timer, PackageCheck, Truck, Package, AlertCircle, CheckCircle2, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderTimer } from "@/hooks/useOrderTimer";

import { useOrders, type Order } from "@/context/OrderContext";
import { type StatusConfig } from "@/app/dashboard/customer/orders/page";

interface OrderCardProps {
  order: Order;
  config: StatusConfig;
  accent: string;
  gradientFrom: string;
  isPaying: boolean;
  isReordering: boolean;
  onPay: (id: string) => void;
  onReorder: (id: string) => void;
  onRate: (order: Order) => void;
  onTrack: (id: string) => void;
  onExpire: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function OrderCard({
  order,
  config,
  accent,
  gradientFrom,
  isPaying,
  isReordering,
  onPay,
  onReorder,
  onRate,
  onTrack,
  onExpire,
  onCancel
}: OrderCardProps) {
  const isPending = order.status === "PENDING_CONFIRMATION";
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";

  const { formattedTime, isExpired } = useOrderTimer(
    order.createdAt,
    10,
    () => { if (isPending) onExpire(order.id); }
  );

  // 5-min payment window after owner accepts — auto-cancel when it expires
  const confirmedTimer = useOrderTimer(
    order.status === "CONFIRMED" ? (order.confirmedAt ?? null) : null,
    5,
    () => { if (order.status === "CONFIRMED") onExpire(order.id); }
  );

  // 3-min cancel window after payment
  const paidTimer = useOrderTimer(
    order.status === "PAID" ? (order.paidAt ?? null) : null,
    3
  );

  const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const itemCount = order.items?.length ?? 0;
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md group",
      isPending && "border-amber-200"
    )}>
      {/* Header Info - Desktop Horizontal, Mobile Stacked */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Restaurant Image/Icon Placeholder */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 border border-gray-50 shadow-sm transition-transform group-hover:scale-105"
              style={{ background: `${config.hex}10` }}
            >
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: config.hex }} />
            </div>

            <div className="min-w-0">
              <h3 className="font-heading font-bold text-gray-900 text-base sm:text-lg truncate leading-tight group-hover:text-gray-950">
                {order.restaurant?.name ?? "Restaurant"}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 flex items-center gap-2 font-medium">
                <span>{date}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>ID: {order.id.slice(-6).toUpperCase()}</span>
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
                {isPending && !isExpired && (
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse border border-amber-100">
                    Auto-cancels in {formattedTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-3 sm:pt-0">
            <p className="font-heading font-black text-gray-900 text-lg sm:text-xl tracking-tight">
              £{parseFloat(order.totalAmount).toFixed(2)}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{itemLabel}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-50" />

        {/* Content Area: Items + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Items Summary */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Order Items</p>
            <div className="flex flex-wrap gap-1.5">
              {order.items?.map((item, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50/80 rounded-md text-[11px] font-medium text-gray-600 border border-gray-100/50"
                >
                  <span className="font-bold text-gray-400">{item.quantity}×</span>
                  {item.menuItem?.name}
                </span>
              ))}
            </div>
          </div>

          {/* Actions Container */}
          <div className="flex items-center gap-2 shrink-0">
            {order.status === "CONFIRMED" && (
              <div className="flex flex-col items-end gap-2">
                {!confirmedTimer.isExpired && order.confirmedAt && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full animate-pulse border border-amber-100 flex items-center gap-1.5">
                    <Timer className="w-3 h-3" />
                    Pay within {confirmedTimer.formattedTime}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPay(order.id)}
                    disabled={isPaying}
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                  >
                    {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Pay £{parseFloat(order.totalAmount).toFixed(2)}
                  </button>
                  <button
                    onClick={() => onCancel(order.id)}
                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {order.status === "PAID" && !paidTimer.isExpired && order.paidAt && (
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full animate-pulse border border-blue-100 flex items-center gap-1.5">
                  <Timer className="w-3 h-3" />
                  Cancel within {paidTimer.formattedTime}
                </span>
                <button
                  onClick={() => onCancel(order.id)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                >
                  Cancel Order
                </button>
              </div>
            )}

            {isDelivered && !order.review && (
              <button
                onClick={() => onRate(order)}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                <Star className="w-4 h-4 fill-white" />
                Rate Order
              </button>
            )}

            {isDelivered && (
              <button
                onClick={() => onReorder(order.id)}
                disabled={isReordering}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 shadow-md"
                style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
              >
                {isReordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reorder
              </button>
            )}

            {!isCancelled && (
              <button
                onClick={() => onTrack(order.id)}
                className="px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                Track Order
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
