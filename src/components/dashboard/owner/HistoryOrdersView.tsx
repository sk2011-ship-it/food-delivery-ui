"use client";

import React, { useState, useMemo } from "react";
import {
  History, CheckCircle2, AlertCircle, Store,
  Calendar, Clock, Filter, ArrowUpDown, ChevronDown,
  Search, Download, TrendingUp, ChevronLeft, ChevronRight
} from "lucide-react";
import { useOwnerOrders } from "@/context/OwnerOrderContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

type FilterStatus = "ALL" | "DELIVERED" | "CANCELLED";
type SortOption = "LATEST" | "OLDEST" | "REVENUE_DESC";

export default function HistoryOrdersView() {
  const { historyOrders, loading, historyPagination, historyStats, refreshOrders } = useOwnerOrders();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("LATEST");

  React.useEffect(() => {
    refreshOrders({ scope: "history", page: 1 });
  }, [refreshOrders]);

  const handlePageChange = (p: number) => {
    refreshOrders({ 
      scope: "history", 
      page: p, 
      status: statusFilter === "ALL" ? undefined : statusFilter 
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = (status: FilterStatus) => {
    setStatusFilter(status);
    refreshOrders({ 
      scope: "history", 
      page: 1, 
      status: status === "ALL" ? undefined : status 
    });
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...historyOrders]; // Server already filtered correctly based on current statusFilter

    return result.sort((a, b) => {
      if (sortBy === "LATEST") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "OLDEST") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "REVENUE_DESC") return parseFloat(b.totalAmount) - parseFloat(a.totalAmount);
      return 0;
    });
  }, [historyOrders, sortBy]);

  const handleDownload = () => {
    const rows = [
      ["Order ID", "Date", "Status", "Restaurant", "Items", "Total (£)"],
      ...filteredAndSortedOrders.map((o) => [
        o.id,
        new Date(o.updatedAt).toLocaleDateString(),
        o.status,
        o.restaurant?.name ?? "",
        (o.items ?? []).map((i) => `${i.menuItem.name} x${i.quantity}`).join("; "),
        parseFloat(o.totalAmount).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Global stats are now provided by the server and exposed via historyStats from context
  // This ensures yield and counts are accurate across all pages

  return (
    <div className="w-full space-y-4 pb-8 selection:bg-primary/20">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border border-border/40 flex items-center justify-center shadow-sm">
              <History className="w-4 h-4 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Order Archive</h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Historical Records & Analytics</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2">
             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100/50">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">£{historyStats.totalRevenue.toLocaleString()} Total</span>
             </div>
             <button
               onClick={handleDownload}
               title="Download CSV"
               className="p-2.5 bg-white border border-border/40 rounded-2xl shadow-soft hover:shadow-elevated transition-all active:scale-95"
             >
                <Download className="w-4 h-4 text-muted-foreground" />
             </button>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Sorting */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-2 rounded-2xl border border-border/40">
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-full border border-border/40 shadow-sm w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Records" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleStatusChange(f.id as FilterStatus)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5",
                statusFilter === f.id 
                  ? "bg-gray-900 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-gray-900 hover:bg-slate-50"
              )}
            >
              {f.label}
              <span className={cn(
                "px-1 py-0.5 rounded text-[7px] font-bold",
                statusFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {f.id === "ALL" ? (historyStats.deliveredCount + historyStats.cancelledCount) : 
                 f.id === "DELIVERED" ? historyStats.deliveredCount : historyStats.cancelledCount}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto pr-1">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-48 h-10 pl-10 pr-8 bg-white border border-border/40 rounded-full text-[10px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer hover:border-gray-900 transition-colors"
            >
              <option value="LATEST">Latest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="REVENUE_DESC">Highest Revenue</option>
            </select>
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Accessing Archives...</p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="py-32 text-center bg-white/40 glass-premium border border-dashed border-border rounded-[3rem]">
            <div className="w-20 h-20 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inset">
              <History className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">No matching records</h3>
            <p className="text-sm text-muted-foreground font-medium mt-2">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedOrders.map((order) => {
                const isDelivered = order.status === "DELIVERED";
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-border/40 shadow-soft hover:shadow-elevated transition-all overflow-hidden"
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          isDelivered ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {isDelivered ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</span>
                            <span className={cn(
                              "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                              isDelivered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            <Store className="w-3 h-3" />
                            {order.restaurant?.name}
                          </div>
                          <div className="text-[10px] font-medium text-muted-foreground/60 italic">
                            {order.items?.length || 0}x {order.items?.[0]?.menuItem?.name || "Order Items"}
                          </div>
                        </div>
                      </div>

                      {/* Right: Meta & Money */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
                        <div className="flex items-center gap-4 text-right">
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {formatDate(order.updatedAt)} <Calendar className="w-2.5 h-2.5 opacity-40" />
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              Closed {formatTime(order.updatedAt)} <Clock className="w-2.5 h-2.5 opacity-40" />
                            </div>
                          </div>
                          
                          <div className="text-right min-w-[100px]">
                            <div className="text-lg font-black text-gray-900 tracking-tighter">
                              £{parseFloat(order.totalAmount).toFixed(2)}
                            </div>
                            <div className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                              {order.items?.reduce((sum, i) => sum + i.quantity, 0)} Items
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && (
        <Pagination 
          total={historyPagination.total}
          page={historyPagination.page}
          limit={historyPagination.limit}
          onPageChange={handlePageChange}
          accent="#000"
        />
      )}
    </div>
  );
}

function Pagination({ 
  total, 
  page, 
  limit, 
  onPageChange, 
  accent 
}: { 
  total: number; 
  page: number; 
  limit: number; 
  onPageChange: (p: number) => void;
  accent?: string;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  
  for (let i = adjustedStart; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12 py-6">
      <button 
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2.5 rounded-2xl bg-white border border-border/40 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-soft"
      >
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/50 backdrop-blur-sm rounded-[1.5rem] border border-border/30">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "w-11 h-11 rounded-2xl text-xs font-black transition-all duration-300 active:scale-90",
              page === p 
                ? "text-white shadow-elevated" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
            style={page === p ? { background: accent || "black" } : {}}
          >
            {p}
          </button>
        ))}
      </div>

      <button 
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2.5 rounded-2xl bg-white border border-border/40 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-soft"
      >
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
}
