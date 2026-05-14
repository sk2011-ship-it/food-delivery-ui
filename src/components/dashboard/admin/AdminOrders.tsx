"use client";

import React, { useState, useMemo } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, ShoppingBag, PoundSterling, Clock, Eye
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import StatCard from "@/components/dashboard/shared/StatCard";
import { useAdminOrders, type AdminOrder } from "@/context/AdminOrderContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SortField = "id" | "createdAt" | "totalAmount";
type SortOrder = "asc" | "desc";

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_CONFIRMATION: { label: "Pending",          color: "#6b7280", bg: "#f3f4f6" },
  CONFIRMED:            { label: "Confirmed",        color: "#3b82f6", bg: "#eff6ff" },
  PAID:                 { label: "Paid",             color: "#8b5cf6", bg: "#f5f3ff" },
  PREPARING:            { label: "Preparing",        color: "#f59e0b", bg: "#fffbeb" },
  DISPATCH_REQUESTED:   { label: "Dispatch Requested", color: "#fb923c", bg: "#fff7ed" },
  OUT_FOR_DELIVERY:     { label: "Out for Delivery", color: "#8b5cf6", bg: "#f5f3ff" },
  DELIVERED:            { label: "Delivered",        color: "#22c55e", bg: "#f0fdf4" },
  CANCELLED:            { label: "Cancelled",        color: "#ef4444", bg: "#fef2f2" },
  TIMED_OUT:            { label: "Timed Out",        color: "#f97316", bg: "#fff7ed" },
};

const ALL_STATUSES = [
  { value: "all",                  label: "All Orders" },
  { value: "CONFIRMED",            label: "Confirmed" },
  { value: "PAID",                 label: "Paid" },
  { value: "PREPARING",            label: "Preparing" },
  { value: "DISPATCH_REQUESTED",   label: "Dispatch Requested" },
  { value: "OUT_FOR_DELIVERY",     label: "Out for Delivery" },
  { value: "DELIVERED",            label: "Delivered" },
  { value: "TIMED_OUT",            label: "Timed Out" },
  { value: "CANCELLED",            label: "Cancelled" },
];

const PAGE_SIZE = 8;

function SortIcon({
  field,
  activeField,
  order,
}: {
  field: SortField;
  activeField: SortField;
  order: SortOrder;
}) {
  if (activeField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
  return order === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-gray-700" />
    : <ChevronDown className="w-3.5 h-3.5 text-gray-700" />;
}

export default function AdminOrders() {
  const { orders, stats } = useAdminOrders();
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("all");
  const [sort,      setSort]      = useState<SortField>("createdAt");
  const [order,     setOrder]     = useState<SortOrder>("desc");
  const [page,      setPage]      = useState(1);
  const [drawerOrder, setDrawerOrder] = useState<AdminOrder | null>(null);

  /* ── Filter + sort ── */
  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        const q = search.toLowerCase();
        const matchSearch = !q || o.id.toLowerCase().includes(q)
          || (o.user?.name || "anonymous user").toLowerCase().includes(q)
          || o.restaurant.name.toLowerCase().includes(q);
        const isTimeout = o.status === 'CANCELLED' && 
          (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime() >= 290000);

        let matchStatus = status === "all";
        if (status === "TIMED_OUT") {
          matchStatus = isTimeout;
        } else if (status === "CANCELLED") {
          matchStatus = o.status === "CANCELLED" && !isTimeout;
        } else if (status !== "all") {
          matchStatus = o.status === status;
        }

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const factor = order === "asc" ? 1 : -1;
        if (sort === "totalAmount") {
          return (parseFloat(a.totalAmount) - parseFloat(b.totalAmount)) * factor;
        }
        const valA = a[sort] || "";
        const valB = b[sort] || "";
        return valA < valB ? -1 * factor : valA > valB ? 1 * factor : 0;
      });
  }, [orders, search, status, sort, order]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(field); setOrder("asc"); }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Monitor and manage all platform orders" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={`£${Number.parseFloat(stats.totalRevenue || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={PoundSterling}
          color="green"
        />
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          label="Pending Units"
          value={String(stats.pendingOrders)}
          icon={Clock}
          color="amber"
          trend={stats.pendingOrders > 0 ? { value: "Needs attention", positive: false } : undefined}
        />
      </div>

      {/* Filters & Pagination */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none bg-white focus:ring-2 ring-primary/5"
          />
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:w-48">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-gray-300 w-10 text-center uppercase tracking-tighter">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("id")}>
                    Order <SortIcon field="id" activeField={sort} order={order} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 hidden md:table-cell">Restaurant</th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Added <SortIcon field="createdAt" activeField={sort} order={order} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-right font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("totalAmount")}>
                    Total <SortIcon field="totalAmount" activeField={sort} order={order} />
                  </button>
                </th>
                <th className="px-6 py-4 text-center font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No matching orders</p>
                    </div>
                  </td>
                </tr>
              ) : sliced.map((o) => {
                const isTimeout = o.status === 'CANCELLED' && 
                  (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime() >= 290000);
                const meta = isTimeout ? STATUS_META.TIMED_OUT : (STATUS_META[o.status] || { label: o.status, color: "#000", bg: "#f3f4f6" });

                return (
                  <React.Fragment key={o.id}>
                    {/* Desktop View */}
                    <tr className="hover:bg-slate-50/50 transition-colors hidden md:table-row group">
                      <td className="px-6 py-6 font-mono font-bold text-gray-900 text-[11px]">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-6 text-gray-900 font-bold">{o.user?.name || "Anonymous User"}</td>
                      <td className="px-6 py-6 text-gray-500 font-bold hidden md:table-cell">{o.restaurant.name}</td>
                      <td className="px-6 py-6 text-gray-400 font-bold hidden lg:table-cell text-[11px]">
                        {format(new Date(o.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-gray-900">
                        £{parseFloat(o.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <button
                          onClick={() => setDrawerOrder(o)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center transition-all group-hover:bg-gray-900 group-hover:text-white group-hover:shadow-lg group-hover:shadow-gray-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Mobile View */}
                    <tr className="md:hidden">
                      <td colSpan={7} className="p-3">
                        <div 
                          onClick={() => setDrawerOrder(o)}
                          className="p-5 rounded-3xl border border-gray-50 bg-white active:scale-[0.98] transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-mono font-black text-gray-300">#{o.id.slice(0, 8).toUpperCase()}</span>
                            <span
                              className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                              style={{ color: meta.color, background: meta.bg }}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-gray-900 leading-tight">{o.user?.name || "Anonymous User"}</p>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{o.restaurant.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-gray-900">£{parseFloat(o.totalAmount).toFixed(2)}</p>
                                <div className="mt-2 text-gray-900 font-bold text-[10px] uppercase tracking-widest flex items-center justify-end gap-1">
                                    View Details <Eye className="w-3 h-3" />
                                </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer */}
      <OrderDetailsDrawer order={drawerOrder} onClose={() => setDrawerOrder(null)} />
    </div>
  );
}

function Detail({ label, value, colSpan = 1 }: { label: string; value: string, colSpan?: number }) {
  return (
    <div className={cn("space-y-2", colSpan === 2 && "col-span-2")}>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
      <p className="font-bold text-gray-900 text-sm leading-relaxed break-words">{value}</p>
    </div>
  );
}

function OrderDetailsDrawer({ order, onClose }: { order: AdminOrder | null, onClose: () => void }) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] z-[101] flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Order Summary</p>
                <h2 className="text-xl font-black text-gray-900">ID: #{order.id.slice(0, 8).toUpperCase()}</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-8">
                <Detail label="Customer Name" value={order.user?.name || "Anonymous User"} />
                <Detail label="Phone Number" value={order.user?.phone || "-"} />
                <Detail colSpan={2} label="Email Address" value={order.user?.email || "Deleted Account"} />
                <Detail colSpan={2} label="Delivery Address" value={order.deliveryAddress || "N/A"} />
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 pb-4">Menu Selection</p>
                <div className="space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.menuItem.name}</p>
                          <p className="text-[10px] font-medium text-gray-400">Unit Price: £{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-gray-900">£{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                <Detail label="Ordered On" value={format(new Date(order.createdAt), "MMM d, yyyy HH:mm")} />
                <Detail label="Last Update" value={order.updatedAt ? format(new Date(order.updatedAt), "MMM d, yyyy HH:mm") : "N/A"} />
              </div>
            </div>

            {/* Footer Summary */}
            <div className="p-8 bg-slate-50/50 border-t border-gray-100 space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Subtotal Amount</span>
                 <span className="font-black text-gray-900 text-lg">£{parseFloat(order.totalAmount).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Order Status</span>
                 <span 
                   className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                   style={{ 
                     color: (STATUS_META[order.status] || STATUS_META.PENDING_CONFIRMATION).color,
                     backgroundColor: (STATUS_META[order.status] || STATUS_META.PENDING_CONFIRMATION).bg
                   }}
                 >
                   {(STATUS_META[order.status] || STATUS_META.PENDING_CONFIRMATION).label}
                 </span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
