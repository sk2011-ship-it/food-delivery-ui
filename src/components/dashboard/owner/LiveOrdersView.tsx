"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Utensils, Truck, CheckCircle2, Clock, ChevronRight,
  AlertCircle, Loader2, X, RotateCcw, ExternalLink, Bell,
} from "lucide-react";
import { useOwnerStore, type OwnerOrder } from "@/store/useOwnerStore";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useOrderTimer } from "@/hooks/useOrderTimer";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_CONFIRMATION: { label: "New",        className: "bg-amber-100 text-amber-700" },
  CONFIRMED:            { label: "Awaiting payment", className: "bg-blue-100 text-blue-700" },
  PAID:                 { label: "Paid",        className: "bg-blue-100 text-blue-700" },
  PREPARING:            { label: "In kitchen",  className: "bg-purple-100 text-purple-700" },
  OUT_FOR_DELIVERY:     { label: "On the way",  className: "bg-orange-100 text-orange-700" },
  DELIVERED:            { label: "Delivered",   className: "bg-green-100 text-green-700" },
  CANCELLED:            { label: "Cancelled",   className: "bg-red-100 text-red-700" },
};

const STATUS_STRIPE: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-400",
  CONFIRMED:            "bg-blue-300",
  PAID:                 "bg-blue-500",
  PREPARING:            "bg-purple-500",
  OUT_FOR_DELIVERY:     "bg-orange-500",
  DELIVERED:            "bg-green-500",
  CANCELLED:            "bg-red-400",
};

// ── Countdown hook wrapper for PAID 2-min grace window ───────────────────────
function usePaidGraceTimer(paidAt: string | null, updatedAt: string) {
  // 2-minute grace from paidAt (fall back to updatedAt if paidAt not set yet)
  return useOrderTimer(paidAt ?? updatedAt, 2);
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onUpdate,
}: {
  order: OwnerOrder;
  onUpdate: (id: string, status: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const isPending   = order.status === "PENDING_CONFIRMATION";
  const isConfirmed = order.status === "CONFIRMED";
  const isPaid      = order.status === "PAID";
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const badge  = STATUS_BADGE[order.status];
  const stripe = STATUS_STRIPE[order.status] ?? "bg-gray-200";

  // 10-min timer for PENDING (from createdAt) — auto-cancel if expired
  const pendingTimer = useOrderTimer(order.createdAt, 10, () => {
    if (order.status === "PENDING_CONFIRMATION") onUpdate(order.id, "CANCELLED");
  });

  // 5-min timer for CONFIRMED (from confirmedAt) — display only, server cron cancels
  const confirmedTimer = useOrderTimer(
    order.confirmedAt ?? order.createdAt,
    order.confirmedAt ? 5 : 0 // if no confirmedAt yet, treat as expired
  );

  // 2-min grace timer for PAID (from paidAt) — after expiry, show "Start Kitchen"
  const paidGraceTimer = usePaidGraceTimer(order.paidAt, order.updatedAt);

  const handleUpdate = async (status: string) => {
    setBusy(true);
    await onUpdate(order.id, status);
    setBusy(false);
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border overflow-hidden shadow-sm",
        isPending ? "border-amber-300" : "border-gray-100"
      )}
    >
      <div className={cn("h-1 w-full", stripe)} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                #{order.id.slice(-6).toUpperCase()}
              </span>
              {badge && (
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", badge.className)}>
                  {badge.label}
                </span>
              )}

              {/* PENDING: 10-min countdown */}
              {isPending && !pendingTimer.isExpired && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3" />
                  {pendingTimer.formattedTime}
                </span>
              )}

              {/* CONFIRMED: 5-min payment countdown */}
              {isConfirmed && order.confirmedAt && !confirmedTimer.isExpired && (
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <Clock className="w-3 h-3" />
                  {confirmedTimer.formattedTime} to pay
                </span>
              )}

              {/* PAID: 2-min grace countdown */}
              {isPaid && !paidGraceTimer.isExpired && (
                <span className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  <Clock className="w-3 h-3" />
                  Kitchen in {paidGraceTimer.formattedTime}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {order.restaurant?.name} · {formatDistanceToNow(new Date(order.createdAt))} ago
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</p>
            <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-white border border-gray-200 rounded text-xs font-bold text-gray-700">
                  {item.quantity}
                </span>
                <span className="text-sm text-gray-700">{item.menuItem.name}</span>
              </div>
              <span className="text-xs text-gray-500">£{parseFloat(item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">

          {/* PENDING: Accept + Cancel */}
          {isPending && (
            <>
              <button
                disabled={busy}
                onClick={() => handleUpdate("CONFIRMED")}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Accept Order <ChevronRight className="w-3.5 h-3.5" /></>}
              </button>
              <button
                disabled={busy}
                onClick={() => handleUpdate("CANCELLED")}
                className="px-3 py-2.5 rounded-xl text-red-500 border border-red-100 bg-white hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* CONFIRMED: waiting for customer to pay — no owner action */}
          {isConfirmed && (
            <div className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-100 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Waiting for customer payment
            </div>
          )}

          {/* PAID: 2-min grace window then "Start Kitchen" */}
          {isPaid && (
            !paidGraceTimer.isExpired ? (
              <div className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Kitchen starts in {paidGraceTimer.formattedTime}
              </div>
            ) : (
              <button
                disabled={busy}
                onClick={() => handleUpdate("PREPARING")}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Start Kitchen <ChevronRight className="w-3.5 h-3.5" /></>}
              </button>
            )
          )}

          {/* PREPARING: Dispatch */}
          {order.status === "PREPARING" && (
            <button
              disabled={busy}
              onClick={() => handleUpdate("OUT_FOR_DELIVERY")}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Dispatch Order <ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          )}

          {/* OUT_FOR_DELIVERY */}
          {order.status === "OUT_FOR_DELIVERY" && (
            <>
              <button
                disabled={busy}
                onClick={() => handleUpdate("DELIVERED")}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-green-600 text-white hover:bg-green-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Mark Delivered <CheckCircle2 className="w-3.5 h-3.5" /></>}
              </button>
              {order.deliveryJob?.trackingUrl && (
                <a
                  href={order.deliveryJob.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white text-gray-700 border border-gray-200 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          )}

          {/* DELIVERED */}
          {isDelivered && (
            <div className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Delivered
            </div>
          )}

          {/* CANCELLED */}
          {isCancelled && (
            <div className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 flex items-center justify-center gap-1.5">
              <X className="w-3.5 h-3.5" />
              Cancelled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function LiveOrdersView() {
  const { orders, updateOrderStatus, refreshOrders, isLoading } = useOwnerStore();
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevPendingCount = useRef(0);
  const cancellingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Auto-cancel PENDING orders already past 10-minute window on mount
  useEffect(() => {
    const now = Date.now();
    const stale = orders.filter(
      (o) =>
        o.status === "PENDING_CONFIRMATION" &&
        now - new Date(o.createdAt).getTime() > 10 * 60 * 1000 &&
        !cancellingRef.current.has(o.id)
    );
    stale.forEach((o) => {
      cancellingRef.current.add(o.id);
      updateOrderStatus(o.id, "CANCELLED");
    });
  }, [orders, updateOrderStatus]);

  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === "PENDING_CONFIRMATION").length;
    if (pendingCount > prevPendingCount.current) setNewOrderAlert(true);
    prevPendingCount.current = pendingCount;
  }, [orders]);

  useEffect(() => {
    if (!newOrderAlert) return;
    const t = setTimeout(() => setNewOrderAlert(false), 4000);
    return () => clearTimeout(t);
  }, [newOrderAlert]);

  const pending   = orders.filter((o) => o.status === "PENDING_CONFIRMATION");
  const active    = orders.filter((o) => ["CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"].includes(o.status));
  const completed = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  return (
    <div className="space-y-5 pb-8">

      {/* New order toast */}
      {newOrderAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-80 bg-gray-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">New order received</p>
            <p className="text-xs text-gray-400">Check and confirm now</p>
          </div>
          <button onClick={() => setNewOrderAlert(false)} className="hover:bg-white/10 rounded-lg p-1 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Kitchen Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {orders.length === 0 ? "No active orders" : `${orders.length} order${orders.length !== 1 ? "s" : ""} active`}
          </p>
        </div>
        <button
          onClick={() => refreshOrders()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {isLoading && orders.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Utensils className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Kitchen is quiet</p>
          <p className="text-xs text-gray-400 mt-1">No active orders right now</p>
        </div>
      )}

      {/* Pending — highest priority */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
              Needs Attention ({pending.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={updateOrderStatus} />
            ))}
          </div>
        </section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
              In Progress ({active.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={updateOrderStatus} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Completed ({completed.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {completed.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={updateOrderStatus} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
