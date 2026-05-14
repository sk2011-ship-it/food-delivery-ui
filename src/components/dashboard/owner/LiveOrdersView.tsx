"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Utensils, Truck, CheckCircle2,
  Clock, ChevronRight, AlertCircle, Loader2,
  X, Bell, Zap, ExternalLink
} from "lucide-react";
import { useOwnerStore, type OwnerOrder } from "@/store/useOwnerStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

/**
 * LiveOrdersView.tsx - Premium kitchen management dashboard for owners.
 * Features staggered animations, real-time sync, and glassmorphism UI.
 */

const PIPELINE = [
  { id: "PENDING_CONFIRMATION", label: "New", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500" },
  { id: "CONFIRMED", label: "Payment", icon: Clock, color: "text-blue-400", bg: "bg-blue-400" },
  { id: "PAID", label: "Paid", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500" },
  { id: "PREPARING", label: "Kitchen", icon: Utensils, color: "text-purple-500", bg: "bg-purple-500" },
  { id: "DISPATCH_REQUESTED", label: "Dispatching", icon: Truck, color: "text-orange-400", bg: "bg-orange-400" },
  { id: "OUT_FOR_DELIVERY", label: "Dispatched", icon: Truck, color: "text-orange-500", bg: "bg-orange-500" },
];

const STATUS_BAR: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-400",
  CONFIRMED: "bg-blue-400",
  PAID: "bg-blue-500",
  PREPARING: "bg-purple-500",
  DISPATCH_REQUESTED: "bg-orange-400",
  OUT_FOR_DELIVERY: "bg-orange-500",
};

const NEXT_STATUS: Record<string, { label: string; status: string; color: string; disabled?: boolean }> = {
  PENDING_CONFIRMATION: { label: "Accept Order", status: "CONFIRMED", color: "bg-emerald-600 shadow-emerald-200" },
  CONFIRMED: { label: "Waiting for payment", status: "CONFIRMED", color: "bg-slate-100 text-slate-400 shadow-none", disabled: true },
  PAID: { label: "Send to Kitchen", status: "PREPARING", color: "bg-blue-600 shadow-blue-200" },
  PREPARING: { label: "Dispatch Food", status: "DISPATCH_REQUESTED", color: "bg-purple-600 shadow-purple-200" },
  DISPATCH_REQUESTED: { label: "Awaiting Driver", status: "OUT_FOR_DELIVERY", color: "bg-slate-100 text-slate-400 shadow-none", disabled: true },
};

import { useOrderTimer } from "@/hooks/useOrderTimer";

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onUpdate,
}: {
  order: OwnerOrder;
  onUpdate: (id: string, status: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const isPending = order.status === "PENDING_CONFIRMATION";
  const isDelivered = order.status === "DELIVERED";
  const nextAction = NEXT_STATUS[order.status];
  const stepIndex = PIPELINE.findIndex((s) => s.id === order.status);

  const { formattedTime, isExpired } = useOrderTimer(
    order.createdAt,
    10,
    () => {
      if (isPending) {
        console.log(`[Owner] Order ${order.id} timed out. Auto-cancelling...`);
        onUpdate(order.id, "CANCELLED");
      }
    }
  );

  const handleUpdate = async (status: string) => {
    setBusy(true);
    await onUpdate(order.id, status);
    setBusy(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "bg-white rounded-3xl border shadow-soft overflow-hidden transition-all duration-300",
        isPending ? "border-amber-200 ring-4 ring-amber-50" : "border-border/40"
      )}
    >
      <div className={cn("h-1 w-full", STATUS_BAR[order.status] ?? "bg-slate-100")} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-gray-900 tracking-tight">#{order.id.slice(-6).toUpperCase()}</span>
              <span className="text-[9px] font-black text-primary px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded-md uppercase tracking-wider">
                {order.restaurant?.name}
              </span>
              {isPending && !isExpired && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 animate-pulse">
                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                  <span className="text-[10px] font-black text-amber-700 tabular-nums">
                    {formattedTime}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {formatDistanceToNow(new Date(order.createdAt))} ago
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-gray-900 tracking-tighter">£{parseFloat(order.totalAmount).toFixed(2)}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              {order.items.length} Item{order.items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 py-3 border-y border-slate-50 mb-3 overflow-x-auto no-scrollbar">
          {PIPELINE.map((step, idx) => {
            const done = idx <= stepIndex;
            const Icon = step.icon;
            
            // Special handling for Cancelled status to show it's a timeout
            const isTimeout = order.status === 'CANCELLED' && 
              (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime() >= 290000); // ~5 mins
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                    done ? `${step.bg} text-white shadow-lg` : 
                    (order.status === 'CANCELLED' && idx === 0) ? "bg-red-500 text-white shadow-lg" : "bg-muted/30 text-muted-foreground"
                  )}>
                    {order.status === 'CANCELLED' && idx === 0 ? <X className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    done ? "text-gray-900" : 
                    (order.status === 'CANCELLED' && idx === 0) ? "text-red-600" : "text-muted-foreground/40"
                  )}>
                    {order.status === 'CANCELLED' && idx === 0 ? (isTimeout ? "Timed Out" : "Cancelled") : step.label}
                  </span>
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div className={cn(
                    "flex-1 h-px mt-[-18px] transition-all duration-700 min-w-[20px]",
                    idx < stepIndex ? step.bg : "bg-muted/30"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Items Grid */}
        <div className="bg-slate-50/50 rounded-2xl p-3 mb-4 border border-slate-100/50">
          <div className="space-y-1.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-white border border-slate-200 text-[10px] font-black text-primary shadow-sm">
                    {item.quantity}
                  </span>
                  <span className="text-xs font-bold text-gray-700">{item.menuItem.name}</span>
                </div>
                <span className="text-[11px] font-black text-muted-foreground">£{parseFloat(item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {order.deliveryJob?.trackingUrl && (order.status === "DISPATCH_REQUESTED" || order.status === "OUT_FOR_DELIVERY") && (
            <a
              href={order.deliveryJob.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-border/50 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-slate-600"
            >
              Tracking
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {isDelivered && (
            <div className="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Delivered
            </div>
          )}

          {nextAction && (
            <button
              disabled={busy || nextAction.disabled || isDelivered}
              onClick={() => handleUpdate(nextAction.status)}
              className={cn(
                "flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                nextAction.color,
                !nextAction.disabled && "text-white shadow-elevated hover:scale-[1.02] active:scale-95",
                "disabled:opacity-50"
              )}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {nextAction.label}
                  {!nextAction.disabled && <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
          )}

          {isPending && (
            <button
              disabled={busy}
              onClick={() => handleUpdate("CANCELLED")}
              className="px-4 py-3 rounded-2xl text-red-500 border border-red-50 bg-white hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard View ─────────────────────────────────────────────────────────
export default function LiveOrdersView() {
  const { orders, updateOrderStatus, refreshOrders, isLoading } = useOwnerStore();
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevPendingCount = useRef(0);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  useEffect(() => {
    const currentPending = orders.filter(o => o.status === 'PENDING_CONFIRMATION');
    if (currentPending.length > prevPendingCount.current) {
      const timer = setTimeout(() => setNewOrderAlert(true), 0);
      return () => clearTimeout(timer);
    }
    prevPendingCount.current = currentPending.length;
  }, [orders]);

  useEffect(() => {
    if (newOrderAlert) {
      const timer = setTimeout(() => setNewOrderAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [newOrderAlert]);

  return (
    <div className="w-full space-y-4 pb-8 selection:bg-primary/20">
      
      {/* New Order Sticky Alert */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-white">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center animate-pulse">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">New Order High Alert!</h4>
                  <p className="text-[10px] font-bold opacity-80 uppercase">Please check and confirm now.</p>
                </div>
              </div>
              <button 
                onClick={() => setNewOrderAlert(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 bg-white/40 backdrop-blur-sm rounded-3xl p-4 border border-white/20 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Kitchen Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "glass-premium flex items-center gap-3 px-3 py-1.5 rounded-2xl border transition-all duration-1000",
            newOrderAlert ? "border-emerald-500 bg-emerald-50/50" : "border-border/40"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", newOrderAlert ? "bg-emerald-500" : "bg-emerald-500/50")} />
              <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", newOrderAlert ? "text-emerald-700" : "text-slate-500")}>
                {newOrderAlert ? "Order Detected!" : "Live Sync Active"}
              </span>
            </div>
          </div>
          <button
            onClick={() => refreshOrders()}
            className="p-2.5 rounded-2xl bg-white border border-border/40 shadow-soft hover:shadow-elevated transition-all active:rotate-180 duration-500"
          >
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-muted/30 border-t-primary animate-spin" />
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground shimmer px-4 py-1 rounded-lg">Syncing Orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center bg-white/40 glass-premium rounded-[3rem] border border-dashed border-border"
          >
            <div className="w-20 h-20 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inset">
              <Clock className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Kitchen is Quiet</h3>
            <p className="text-sm text-muted-foreground font-medium mt-2">All orders have been dispatched. Enjoy the calm!</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdate={updateOrderStatus}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple internal helper for refresh
function RotateCcw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
