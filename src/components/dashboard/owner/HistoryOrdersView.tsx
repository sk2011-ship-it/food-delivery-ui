"use client";

import React from "react";
import {
  History, CheckCircle2, AlertCircle, Store,
  Calendar, Clock
} from "lucide-react";
import { useOwnerOrders } from "@/context/OwnerOrderContext";
import { cn } from "@/lib/utils";

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

export default function HistoryOrdersView() {
  const { orders, loading } = useOwnerOrders();

  const historyOrders = orders
    .filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const delivered = historyOrders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = historyOrders.filter((o) => o.status === "CANCELLED").length;
  const revenue   = historyOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((s, o) => s + parseFloat(o.totalAmount), 0);

  return (
    <div className="w-full space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            Order History
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Archive of completed and cancelled orders.</p>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && historyOrders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Delivered", count: delivered, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { label: "Cancelled", count: cancelled, color: "bg-red-50 text-red-700 border-red-200"             },
            { label: `£${revenue.toFixed(2)} earned`, count: null, color: "bg-gray-50 text-gray-700 border-gray-200" },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest",
                color
              )}
            >
              {label}
              {count !== null && <span className="font-black">{count}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-gray-400 animate-spin" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Loading archives...
          </p>
        </div>
      ) : historyOrders.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-gray-200" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No history yet</p>
          <p className="text-xs text-gray-400 mt-0.5">Records appear here once orders are closed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {historyOrders.map((order) => {
              const isDelivered = order.status === "DELIVERED";
              return (
                <div key={order.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          isDelivered ? "bg-emerald-50" : "bg-red-50"
                        )}
                      >
                        {isDelivered ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                              isDelivered
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            )}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                          <Store className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {order.restaurant.name}
                        </p>
                        {/* Items */}
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {order.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                        </p>
                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-2.5 h-2.5" />
                            Closed {formatTime(order.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
