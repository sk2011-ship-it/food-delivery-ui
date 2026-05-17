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
import { motion } from "framer-motion";

const STATUS_COLOR: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED:   "bg-blue-100 text-blue-700 border-blue-200",
  PAID:        "bg-cyan-100 text-cyan-700 border-cyan-200",
  PREPARING:   "bg-purple-100 text-purple-700 border-purple-200",
  DISPATCH_REQUESTED: "bg-orange-100 text-orange-700 border-orange-200",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 border-orange-200",
  DELIVERED:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED:   "bg-red-100 text-red-700 border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-500",
  CONFIRMED:   "bg-blue-500",
  PAID:        "bg-cyan-500",
  PREPARING:   "bg-purple-500",
  DISPATCH_REQUESTED: "bg-orange-400",
  OUT_FOR_DELIVERY: "bg-orange-500",
  DELIVERED:   "bg-emerald-500",
  CANCELLED:   "bg-red-500",
};


export default function OwnerOverview({ user }: { user: SessionUser }) {
  const { orders, loading } = useOwnerOrders();

  const activeOrders = orders
    .filter(o =>
      ["PENDING_CONFIRMATION","CONFIRMED","PAID","PREPARING","OUT_FOR_DELIVERY"].includes(o.status)
      || o.status === "DISPATCH_REQUESTED"
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const pendingCount  = orders.filter(o => o.status === "PENDING_CONFIRMATION").length;
  const activeCount   = orders.filter(o => ["PAID","PREPARING","DISPATCH_REQUESTED","OUT_FOR_DELIVERY"].includes(o.status)).length;
  const deliveredToday = orders.filter(o => o.status === "DELIVERED").length;
  
  const revenueStatuses = ["CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY", "DELIVERED"];

  const totalRevenue = orders
    .filter(o => revenueStatuses.includes(o.status))
    .reduce((s, o) => s + parseFloat(o.totalAmount || "0"), 0);

  // Calculate real performance breakdown
  const siteStatsMap = orders.reduce((acc, order) => {
    if (!revenueStatuses.includes(order.status)) return acc;
    const name = order.restaurant?.name || "Unknown";
    if (!acc[name]) {
      acc[name] = { orders: 0, revenue: 0 };
    }
    acc[name].orders += 1;
    acc[name].revenue += parseFloat(order.totalAmount || "0");
    return acc;
  }, {} as Record<string, { orders: number, revenue: number }>);

  // Convert to array and calculate max revenue to get percentage
  const maxRevenue = Object.values(siteStatsMap).reduce((max, site) => Math.max(max, site.revenue), 0);
  
  const colors = ["bg-primary", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500"];
  
  const sites = Object.entries(siteStatsMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, stats], index) => ({
      name,
      orders: stats.orders,
      revenue: `£${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pct: maxRevenue > 0 ? (stats.revenue / maxRevenue) * 100 : 0,
      color: colors[index % colors.length]
    }));

  return (
    <div className="w-full space-y-8 pb-12 selection:bg-primary/20">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-white rounded-full border border-border/40 shadow-soft">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kitchen Sync Active</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "New Orders",   value: pendingCount,    icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", trend: "Needs attention" },
          { label: "In Kitchen",   value: activeCount,     icon: Utensils,    color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100", trend: "Active now" },
          { label: "Completed",     value: deliveredToday,  icon: CheckCircle2,color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100", trend: "Today" },
          { label: "Total Revenue", value: `£${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10", trend: "Gross sales" },
        ].map(({ label, value, icon: Icon, color, bg, border, trend }) => (
          <div key={label} className="group bg-white rounded-3xl border border-border/40 p-6 shadow-soft hover:shadow-elevated transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-2xl border transition-transform group-hover:scale-110 duration-300", bg, border)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{trend}</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border/40 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-border/40 flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Recent Activity</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time order stream</p>
              </div>
            </div>
            <Link
              href="/dashboard/owner/orders"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95 shadow-elevated"
            >
              Order Desk <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/40 px-4">
            {loading ? (
              <div className="py-24 flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Syncing data...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-inset">
                  <Clock className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h4 className="text-lg font-black text-gray-900 tracking-tight">System Idle</h4>
                <p className="text-sm text-muted-foreground mt-1 font-medium italic">New tickets will appear automatically.</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/dashboard/owner/orders"
                  className="flex items-center justify-between px-4 py-5 hover:bg-slate-50/80 rounded-2xl transition-all group my-1 border border-transparent hover:border-border/40"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse shadow-sm",
                      STATUS_DOT[order.status] ?? "bg-slate-300"
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors tracking-tight">
                        {order.restaurant.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                        #{order.id.slice(-6).toUpperCase()} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                       <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm transition-all group-hover:scale-105",
                        STATUS_COLOR[order.status] ?? "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-base font-black text-gray-900 tracking-tight">£{parseFloat(order.totalAmount).toFixed(2)}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Zone Metrics */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-border/40 shadow-soft overflow-hidden h-fit">
            <div className="flex items-center gap-3 px-8 py-6 border-b border-border/40 bg-slate-50/30">
              <div className="w-10 h-10 rounded-2xl bg-white border border-border/40 flex items-center justify-center shadow-sm">
                <BarChart2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Performance</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Regional Breakdown</p>
              </div>
            </div>
            <div className="p-8 space-y-8">
              {sites.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">No data available</p>
                </div>
              ) : (
                sites.map((site) => (
                  <div key={site.name} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full shadow-sm", site.color)} />
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{site.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900 leading-none tracking-tight">{site.revenue}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{site.orders} orders</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-border/20 shadow-inset">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${site.pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full rounded-full shadow-sm", site.color)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-8 py-4 bg-slate-50/50 border-t border-border/40">
              <Link
                href="/dashboard/owner/restaurants"
                className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
              >
                <span className="flex items-center gap-2"><Store className="w-3.5 h-3.5" /> Property Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}
