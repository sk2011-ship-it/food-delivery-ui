"use client";

import React from "react";
import {
  TrendingUp, Store, ShoppingBag, Clock,
  CheckCircle2, Utensils, Truck, ChevronRight,
  ArrowRight, Activity, BarChart2, AlertCircle
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useOwnerOrders } from "@/context/OwnerOrderContext";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED:   "bg-blue-100 text-blue-700 border-blue-200",
  PAID:        "bg-cyan-100 text-cyan-700 border-cyan-200",
  PREPARING:   "bg-purple-100 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 border-orange-200",
  DELIVERED:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED:   "bg-red-100 text-red-700 border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-500",
  CONFIRMED:   "bg-blue-500",
  PAID:        "bg-cyan-500",
  PREPARING:   "bg-purple-500",
  OUT_FOR_DELIVERY: "bg-orange-500",
  DELIVERED:   "bg-emerald-500",
  CANCELLED:   "bg-red-500",
};

const sites = [
  { name: "Kilkeel Eats",      orders: 142, revenue: "£2,840", pct: 68, color: "bg-red-500" },
  { name: "Newcastle Eats",    orders: 98,  revenue: "£1,960", pct: 46, color: "bg-green-600" },
  { name: "Downpatrick Eats",  orders: 175, revenue: "£3,500", pct: 82, color: "bg-blue-600" },
];

export default function OwnerOverview({ user }: { user: SessionUser }) {
  const { orders, loading } = useOwnerOrders();

  const activeOrders = orders
    .filter(o =>
      ["PENDING_CONFIRMATION","CONFIRMED","PAID","PREPARING","OUT_FOR_DELIVERY"].includes(o.status)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const pendingCount  = orders.filter(o => o.status === "PENDING_CONFIRMATION").length;
  const activeCount   = orders.filter(o => ["PAID","PREPARING","OUT_FOR_DELIVERY"].includes(o.status)).length;
  const deliveredToday = orders.filter(o => o.status === "DELIVERED").length;
  const totalRevenue = orders
    .filter(o => o.status === "DELIVERED")
    .reduce((s, o) => s + parseFloat(o.totalAmount), 0);

  return (
    <div className="w-full space-y-5 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">
            Good day, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Here's your restaurant platform overview.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending",       value: pendingCount,    icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "In Progress",   value: activeCount,     icon: Utensils,    color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100" },
          { label: "Delivered",     value: deliveredToday,  icon: CheckCircle2,color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100"},
          { label: "Revenue",       value: `£${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <div className={cn("p-2 rounded-lg border", bg, border)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Live Activity</span>
            </div>
            <Link
              href="/dashboard/owner/orders"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
            >
              Order Desk <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-gray-100 border-t-blue-500 animate-spin" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Syncing...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-gray-200" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Queue is clear</p>
                <p className="text-xs text-gray-400 mt-0.5">No active orders right now.</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/dashboard/owner/orders"
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      STATUS_DOT[order.status] ?? "bg-gray-400"
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {order.restaurant.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        #{order.id.slice(0, 8)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                      STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500 border-gray-200"
                    )}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Zone Metrics */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Zone Metrics</span>
          </div>
          <div className="divide-y divide-gray-50">
            {sites.map((site) => (
              <div key={site.name} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", site.color)} />
                    <span className="text-xs font-semibold text-gray-700">{site.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{site.revenue}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", site.color)}
                      style={{ width: `${site.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{site.orders} orders</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="px-4 py-3 border-t border-gray-50">
            <Link
              href="/dashboard/owner/restaurants"
              className="flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
            >
              <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> My Restaurants</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
