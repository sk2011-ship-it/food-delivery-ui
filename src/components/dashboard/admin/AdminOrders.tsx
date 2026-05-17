"use client";

import React, { useState, useMemo } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, ShoppingBag, PoundSterling,
  Clock, X,
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
  PENDING_CONFIRMATION: { label: "Pending",            color: "#6b7280", bg: "#f3f4f6" },
  CONFIRMED:            { label: "Confirmed",          color: "#3b82f6", bg: "#eff6ff" },
  PAID:                 { label: "Paid",               color: "#8b5cf6", bg: "#f5f3ff" },
  PREPARING:            { label: "Preparing",          color: "#f59e0b", bg: "#fffbeb" },
  DISPATCH_REQUESTED:   { label: "Dispatch Req.",      color: "#fb923c", bg: "#fff7ed" },
  OUT_FOR_DELIVERY:     { label: "Out for Delivery",   color: "#8b5cf6", bg: "#f5f3ff" },
  DELIVERED:            { label: "Delivered",          color: "#22c55e", bg: "#f0fdf4" },
  CANCELLED:            { label: "Cancelled",          color: "#ef4444", bg: "#fef2f2" },
  TIMED_OUT:            { label: "Timed Out",          color: "#f97316", bg: "#fff7ed" },
};

const ALL_STATUSES = [
  { value: "all",                label: "All Orders" },
  { value: "CONFIRMED",          label: "Confirmed" },
  { value: "PAID",               label: "Paid" },
  { value: "PREPARING",          label: "Preparing" },
  { value: "DISPATCH_REQUESTED", label: "Dispatch Requested" },
  { value: "OUT_FOR_DELIVERY",   label: "Out for Delivery" },
  { value: "DELIVERED",          label: "Delivered" },
  { value: "TIMED_OUT",          label: "Timed Out" },
  { value: "CANCELLED",          label: "Cancelled" },
];

const PAGE_SIZE = 10;

function SortIcon({ field, activeField, order }: { field: SortField; activeField: SortField; order: SortOrder }) {
  if (activeField !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />;
  return order === "asc"
    ? <ChevronUp   className="w-3 h-3 text-gray-600" />
    : <ChevronDown className="w-3 h-3 text-gray-600" />;
}

export default function AdminOrders() {
  const { orders, stats } = useAdminOrders();
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("all");
  const [sort,        setSort]        = useState<SortField>("createdAt");
  const [order,       setOrder]       = useState<SortOrder>("desc");
  const [page,        setPage]        = useState(1);
  const [drawerOrder, setDrawerOrder] = useState<AdminOrder | null>(null);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          o.id.toLowerCase().includes(q) ||
          (o.user?.name || "").toLowerCase().includes(q) ||
          o.restaurant.name.toLowerCase().includes(q);

        const isTimeout =
          o.status === "CANCELLED" &&
          new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime() >= 600000;

        let matchStatus = status === "all";
        if (status === "TIMED_OUT")   matchStatus = isTimeout;
        else if (status === "CANCELLED") matchStatus = o.status === "CANCELLED" && !isTimeout;
        else if (status !== "all")    matchStatus = o.status === status;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const factor = order === "asc" ? 1 : -1;
        if (sort === "totalAmount") return (parseFloat(a.totalAmount) - parseFloat(b.totalAmount)) * factor;
        const va = a[sort] ?? "";
        const vb = b[sort] ?? "";
        return va < vb ? -factor : va > vb ? factor : 0;
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
    <div className="space-y-5">
      <PageHeader title="Orders" subtitle="Monitor and manage all platform orders" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Revenue"
          value={`£${parseFloat(stats.totalRevenue || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
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
          label="Pending"
          value={String(stats.pendingOrders)}
          icon={Clock}
          color="amber"
          trend={stats.pendingOrders > 0 ? { value: "Needs attention", positive: false } : undefined}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID, customer or restaurant…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none bg-white focus:border-gray-400"
          />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("id")}>
                    Order <SortIcon field="id" activeField={sort} order={order} />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Customer</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Date <SortIcon field="createdAt" activeField={sort} order={order} />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("totalAmount")}>
                    Amount <SortIcon field="totalAmount" activeField={sort} order={order} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <ShoppingBag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No matching orders</p>
                  </td>
                </tr>
              ) : sliced.map((o) => {
                const isTimeout =
                  o.status === "CANCELLED" &&
                  new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime() >= 600000;
                const meta = isTimeout
                  ? STATUS_META.TIMED_OUT
                  : (STATUS_META[o.status] || { label: o.status, color: "#000", bg: "#f3f4f6" });

                return (
                  <tr
                    key={o.id}
                    onClick={() => setDrawerOrder(o)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] text-gray-600 font-medium">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">
                      {o.user?.name || <span className="text-gray-400 italic">Anonymous</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                      {format(new Date(o.createdAt), "MMM d, HH:mm")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      £{parseFloat(o.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer: count + pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {total === 0
              ? "No results"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} orders`}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      <OrderDetailsDrawer order={drawerOrder} onClose={() => setDrawerOrder(null)} />
    </div>
  );
}

/* ── Detail drawer ─────────────────────────────────────────── */
function Detail({ label, value, colSpan = 1 }: { label: string; value: string; colSpan?: number }) {
  return (
    <div className={cn("space-y-1", colSpan === 2 && "col-span-2")}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words leading-snug">{value}</p>
    </div>
  );
}

function OrderDetailsDrawer({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-medium">Order details</p>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">
                  #{order.id.slice(0, 8).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{order.restaurant?.name}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Customer */}
              <div className="px-6 py-5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</p>
                <div className="grid grid-cols-2 gap-4">
                  <Detail label="Name"    value={order.user?.name  || "Anonymous"} />
                  <Detail label="Phone"   value={order.user?.phone || "—"} />
                  <Detail colSpan={2} label="Email"   value={order.user?.email || "Deleted account"} />
                  <Detail colSpan={2} label="Address" value={order.deliveryAddress || "N/A"} />
                </div>
              </div>

              {/* Items */}
              <div className="px-6 py-5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Order Items · {order.items?.length ?? 0} {(order.items?.length ?? 0) === 1 ? "item" : "items"}
                </p>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto] gap-x-3 mb-2 pb-2 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Subtotal</p>
                </div>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => {
                    const unitPrice = parseFloat(item.price);
                    const subtotal  = unitPrice * item.quantity;
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_auto] gap-x-3 items-start">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{item.menuItem.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.quantity} × £{unitPrice.toFixed(2)} = £{subtotal.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 shrink-0 pt-0.5">
                          £{subtotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <Detail label="Ordered"     value={format(new Date(order.createdAt), "MMM d, yyyy HH:mm")} />
                  <Detail label="Last update" value={order.updatedAt ? format(new Date(order.updatedAt), "MMM d, yyyy HH:mm") : "N/A"} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span className="text-lg font-bold text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Status</span>
                {(() => {
                  const meta = STATUS_META[order.status] || STATUS_META.PENDING_CONFIRMATION;
                  return (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
