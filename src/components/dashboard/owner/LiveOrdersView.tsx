"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils, Package, Truck, CheckCircle2,
  Clock, ChevronRight, AlertCircle, Loader2,
  Store, X
} from "lucide-react";
import { useOwnerOrders, OwnerOrder } from "@/context/OwnerOrderContext";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatTimeAgo = (dateString: string) => {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateString).toLocaleDateString();
};

const PIPELINE = [
  { id: "PENDING_CONFIRMATION", label: "New",      icon: AlertCircle, color: "text-amber-500",   bg: "bg-amber-500" },
  { id: "PAID",                 label: "Paid",     icon: CheckCircle2,color: "text-blue-500",    bg: "bg-blue-500"  },
  { id: "PREPARING",            label: "Kitchen",  icon: Utensils,    color: "text-purple-500",  bg: "bg-purple-500"},
  { id: "OUT_FOR_DELIVERY",     label: "On Road",  icon: Truck,       color: "text-orange-500",  bg: "bg-orange-500"},
];

const STATUS_BAR: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-400",
  CONFIRMED:            "bg-blue-400",
  PAID:                 "bg-blue-500",
  PREPARING:            "bg-purple-500",
  OUT_FOR_DELIVERY:     "bg-orange-500",
};

const NEXT_STATUS: Record<string, { label: string; status: string; color: string }> = {
  PENDING_CONFIRMATION: { label: "Accept Order",      status: "CONFIRMED",        color: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" },
  PAID:                 { label: "Send to Kitchen",   status: "PREPARING",        color: "bg-blue-600 hover:bg-blue-700 shadow-blue-100" },
  PREPARING:            { label: "Mark Ready",        status: "OUT_FOR_DELIVERY", color: "bg-purple-600 hover:bg-purple-700 shadow-purple-100" },
  OUT_FOR_DELIVERY:     { label: "Mark Delivered",    status: "DELIVERED",        color: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" },
};

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onUpdate,
}: {
  order: OwnerOrder;
  onUpdate: (id: string, status: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(order.createdAt));

  useEffect(() => {
    const t = setInterval(() => setTimeAgo(formatTimeAgo(order.createdAt)), 60000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  const isPending = order.status === "PENDING_CONFIRMATION";
  const nextAction = NEXT_STATUS[order.status];

  const stepIndex = PIPELINE.findIndex((s) => s.id === order.status);

  const handle = async (status: string) => {
    setBusy(true);
    await onUpdate(order.id, status);
    setBusy(false);
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border shadow-sm overflow-hidden transition-all",
        isPending ? "border-amber-200 shadow-amber-50" : "border-gray-100"
      )}
    >
      {/* status bar */}
      <div className={cn("h-0.5 w-full", STATUS_BAR[order.status] ?? "bg-gray-200")} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</span>
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                  isPending
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-gray-50 text-gray-500 border-gray-100"
                )}
              >
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium">{timeAgo}</span>
              <span className="text-gray-200">·</span>
              <Store className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium truncate max-w-[160px]">
                {order.restaurant.name}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</p>
            <p className="text-[10px] text-gray-400 font-medium">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Pipeline stepper */}
        <div className="flex items-center gap-1 mb-3 py-2">
          {PIPELINE.map((step, idx) => {
            const done = idx <= stepIndex;
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      done ? `${step.bg} text-white` : "bg-gray-100 text-gray-300"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span
                    className={cn(
                      "text-[8px] font-bold uppercase tracking-widest",
                      done ? "text-gray-700" : "text-gray-300"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px mb-4 transition-all",
                      idx < stepIndex ? step.bg : "bg-gray-100"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
          <div className="space-y-1.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-white border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-700 flex-shrink-0">
                    {item.quantity}
                  </span>
                  <span className="font-medium text-gray-700">{item.menuItem.name}</span>
                </div>
                <span className="text-gray-400 font-semibold">£{parseFloat(item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={cn("flex gap-2", isPending ? "" : "justify-end")}>
          {nextAction && (
            <button
              disabled={busy}
              onClick={() => handle(nextAction.status)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-white shadow-lg transition-all flex items-center justify-center gap-2",
                nextAction.color,
                "hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
              )}
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  {nextAction.label}
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {isPending && (
            <button
              disabled={busy}
              onClick={() => handle("CANCELLED")}
              className="px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-red-500 border border-red-100 bg-white hover:bg-red-50 transition-all disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function LiveOrdersView() {
  const { orders, updateOrderStatus, refreshOrders, loading } = useOwnerOrders();

  useEffect(() => {
    refreshOrders();
    const onFocus = () => refreshOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshOrders]);

  const activeOrders = orders
    .filter((o) =>
      ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pending   = activeOrders.filter((o) => o.status === "PENDING_CONFIRMATION").length;
  const inKitchen = activeOrders.filter((o) => ["PAID","PREPARING"].includes(o.status)).length;
  const onRoad    = activeOrders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;

  return (
    <div className="w-full space-y-4 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-blue-600" />
            Live Orders
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your kitchen in real-time.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Sync</span>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && activeOrders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Pending",    count: pending,   color: "bg-amber-50 text-amber-700 border-amber-200"   },
            { label: "In Kitchen", count: inKitchen, color: "bg-purple-50 text-purple-700 border-purple-200"},
            { label: "On Road",    count: onRoad,    color: "bg-orange-50 text-orange-700 border-orange-200"},
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest", color)}
            >
              {label}
              <span className="font-black">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Syncing kitchen...
          </p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-200" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Kitchen is idle</p>
          <p className="text-xs text-gray-400 mt-0.5">All orders have been dispatched.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdate={updateOrderStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
