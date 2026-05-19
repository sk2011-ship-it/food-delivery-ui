"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard, TrendingUp, Clock, CheckCircle2,
  Search, ChevronLeft, ChevronRight, ChevronDown,
  Banknote, Info, RefreshCw, X, History, FileText, Store, ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import StatCard from "@/components/dashboard/shared/StatCard";
import { adminPaymentApi, type SettlementSummary } from "@/lib/api";
import { toast } from "sonner";
import { Modal, ModalActions, Field } from "@/components/dashboard/admin/AdminRestaurants";

const PAGE_SIZE = 10;

/* ── Settlement modal ── */
function SettleModal({
  restaurant,
  onClose,
  onSuccess,
}: {
  restaurant: SettlementSummary["restaurants"][0];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading,       setLoading]       = useState(false);
  const [allOrders,     setAllOrders]     = useState<any[]>([]);
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [fetching,      setFetching]      = useState(true);
  const [notes,         setNotes]         = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    setFetching(true);
    adminPaymentApi
      .getUnpaidOrders(restaurant.id)
      .then((res) => {
        if (res.success) {
          const orders = res.data?.unpaidOrders || [];
          setAllOrders(orders);
          // Default: select all
          setSelected(new Set(orders.map((o: any) => o.id)));
        } else {
          toast.error(res.error || "Failed to load unpaid orders");
        }
      })
      .catch(() => toast.error("Internal error fetching orders"))
      .finally(() => setFetching(false));
  }, [restaurant.id]);

  const selectedOrders = allOrders.filter(o => selected.has(o.id));
  const selectedTotal  = selectedOrders.reduce((s: number, o: any) => s + parseFloat(o.totalAmount || "0"), 0);
  const allSelected    = allOrders.length > 0 && selected.size === allOrders.length;

  const toggleOrder = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allOrders.map((o: any) => o.id)));
  };

  const handleSettle = async () => {
    if (selected.size === 0) { toast.error("Select at least one order to settle."); return; }
    setLoading(true);
    const res = await adminPaymentApi.settle({
      restaurantId: restaurant.id,
      orderIds: [...selected],
      transactionId,
      notes,
    });
    setLoading(false);
    if (res.success) {
      toast.success(`Settled £${selectedTotal.toFixed(2)} for ${restaurant.name}`);
      onSuccess();
    } else {
      toast.error(res.error || "Failed to process settlement");
    }
  };

  return (
    <Modal
      title={`Settle Payout — ${restaurant.name}`}
      onClose={onClose}
      icon={<Banknote className="w-5 h-5 text-green-500" />}
    >
      <div className="space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Unsettled orders</p>
            <p className="text-base font-black text-gray-900">{allOrders.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
            <p className="text-[10px] text-amber-600 font-medium mb-0.5">Selected</p>
            <p className="text-base font-black text-amber-700">{selected.size}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
            <p className="text-[10px] text-green-600 font-medium mb-0.5">Amount</p>
            <p className="text-base font-black text-green-700">£{selectedTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Transaction reference + notes */}
        <Field label="Bank / Transaction Reference">
          <input
            type="text"
            placeholder="e.g. TR-982103"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
          />
        </Field>
        <Field label="Internal Notes (optional)">
          <input
            type="text"
            placeholder="Paid via bank transfer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
          />
        </Field>

        {/* Selectable orders list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Select orders to include
            </p>
            {!fetching && allOrders.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
            {fetching ? (
              <p className="py-6 text-center text-xs text-gray-400">Loading orders…</p>
            ) : allOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No unsettled orders.</p>
            ) : allOrders.map((o: any) => {
              const checked = selected.has(o.id);
              return (
                <label
                  key={o.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    checked ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOrder(o.id)}
                    className="w-4 h-4 rounded accent-gray-900 shrink-0"
                  />
                  <span className="font-mono text-xs text-gray-600 flex-1">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <span className={`text-xs font-semibold ml-2 ${checked ? "text-gray-900" : "text-gray-400"}`}>
                    £{parseFloat(o.totalAmount).toFixed(2)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Remaining after this settlement */}
          {!fetching && allOrders.length > 0 && selected.size < allOrders.length && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {allOrders.length - selected.size} order{allOrders.length - selected.size !== 1 ? "s" : ""} (
                £{(restaurant.pendingBalance - selectedTotal).toFixed(2)}) will remain unsettled after this payment.
              </p>
            </div>
          )}
        </div>

        {/* Confirm info */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-700 leading-relaxed">
            Only the {selected.size} selected order{selected.size !== 1 ? "s" : ""} will be marked as settled.
            Make sure the bank transfer has been sent before confirming.
          </p>
        </div>

        <ModalActions
          onCancel={onClose}
          onConfirm={handleSettle}
          confirmLabel={loading ? "Processing…" : `Confirm £${selectedTotal.toFixed(2)}`}
          confirmColor="var(--dash-accent)"
          loading={loading}
          disabled={fetching || selected.size === 0}
        />
      </div>
    </Modal>
  );
}

// ── Settlement History types ──
type HistoryPeriod = "7d" | "30d" | "90d" | "all";

interface SettlementOrder {
  id: string;
  totalAmount: string;
  date: string;
  status: string;
}

interface SettlementRecord {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string | null;
  amount: string;
  status: "PENDING" | "COMPLETED";
  transactionId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
  orderCount: number;
  createdAt: string;
  orders: SettlementOrder[];
}

const HISTORY_PERIODS: { label: string; value: HistoryPeriod }[] = [
  { label: "Last 7 Days",  value: "7d"  },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "All Time",     value: "all" },
];

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SettlementHistorySection() {
  const [period, setPeriod]         = useState<HistoryPeriod>("30d");
  const [records, setRecords]       = useState<SettlementRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");

  const fetchHistory = useCallback(async (p: HistoryPeriod) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/history?period=${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load history");
      setRecords(json.data?.settlements ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(period); }, [period, fetchHistory]);

  const filtered = useMemo(() =>
    records.filter(r => r.restaurantName.toLowerCase().includes(search.toLowerCase())),
    [records, search]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <History className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Settlement History</h2>
            {!loading && (
              <p className="text-xs text-gray-400">{filtered.length} settlement{filtered.length !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter restaurant…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 outline-none bg-white focus:border-gray-400 w-40"
            />
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as HistoryPeriod)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white outline-none focus:border-gray-400 cursor-pointer"
            >
              {HISTORY_PERIODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => fetchHistory(period)}
            disabled={loading}
            className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-gray-50">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-64" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">No settlements found</p>
          <p className="text-xs text-gray-400">No settlements match the selected period.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(s => {
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id}>
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Restaurant icon */}
                  {s.restaurantLogo ? (
                    <img src={s.restaurantLogo} className="w-9 h-9 rounded-xl object-cover border border-gray-100 shrink-0 mt-0.5" alt={s.restaurantName} />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">
                      {s.restaurantName[0]}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{s.restaurantName}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        s.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {s.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {s.status === "COMPLETED" ? "Settled" : "Pending"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span>{s.orderCount} order{s.orderCount !== 1 ? "s" : ""}</span>
                      {(s.periodStart || s.periodEnd) && (
                        <span>Period: {fmtDate(s.periodStart)} → {fmtDate(s.periodEnd)}</span>
                      )}
                      {s.transactionId && (
                        <span className="font-mono">Ref: {s.transactionId}</span>
                      )}
                      <span className="text-gray-400">{fmtDate(s.createdAt)}</span>
                    </div>
                    {s.notes && (
                      <div className="mt-1.5 flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                        <FileText className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-800 leading-relaxed">{s.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Amount + expand */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-base font-black text-gray-900">£{parseFloat(s.amount).toFixed(2)}</p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Expanded order list */}
                {isExpanded && (
                  <div className="px-5 pb-4 bg-gray-50/50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Orders in this settlement ({s.orders.length})
                    </p>
                    {s.orders.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Order details not available for this settlement.</p>
                    ) : (
                      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                        <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>Order ID</span>
                          <span>Date</span>
                          <span className="text-right">Amount</span>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                          {s.orders.map(o => (
                            <div key={o.id} className="grid grid-cols-3 gap-2 px-3 py-2 text-xs items-center">
                              <span className="font-mono text-gray-600">#{o.id.slice(0, 8).toUpperCase()}</span>
                              <span className="text-gray-500">{fmtDate(o.date)}</span>
                              <span className="text-right font-semibold text-gray-900">£{parseFloat(o.totalAmount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100 bg-gray-50">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
                          <span className="text-sm font-black text-gray-900">£{parseFloat(s.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Period = "today" | "week" | "month" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today",      value: "today" },
  { label: "This Week",  value: "week"  },
  { label: "This Month", value: "month" },
  { label: "All Time",   value: "all"   },
];

/* ── Main component ── */
export default function AdminPayments() {
  const [summary,      setSummary]      = useState<SettlementSummary | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [settleTarget, setSettleTarget] = useState<SettlementSummary["restaurants"][0] | null>(null);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [period,       setPeriod]       = useState<Period>("month");

  const refresh = async (p: Period = period) => {
    setLoading(true);
    const res = await adminPaymentApi.getSummary(p);
    if (res.success && res.data) setSummary(res.data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setPage(1);
    refresh(p);
  };

  const filtered = useMemo(() =>
    (summary?.restaurants ?? []).filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    ), [summary, search]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const settledTotal = summary?.platformSummary.totalSettled ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Restaurant earnings and payout settlements"
        action={
          <button
            onClick={() => refresh(period)}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {/* Period filter + search on same line */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handlePeriodChange(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by restaurant name…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none bg-white focus:border-gray-400"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label={`Revenue · ${PERIODS.find(p => p.value === period)?.label}`}
          value={`£${(summary?.platformSummary.totalPlatformRevenue ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label={`Pending · ${PERIODS.find(p => p.value === period)?.label}`}
          value={`£${(summary?.platformSummary.totalPendingPayouts ?? 0).toFixed(2)}`}
          icon={Clock}
          color="amber"
          trend={(summary?.platformSummary.totalPendingPayouts ?? 0) > 0
            ? { value: "Needs settling", positive: false }
            : undefined}
        />
        <StatCard
          label={`Settled · ${PERIODS.find(p => p.value === period)?.label}`}
          value={`£${settledTotal.toFixed(2)}`}
          icon={CheckCircle2}
          color="blue"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Restaurant</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden sm:table-cell">Total Earned</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">Already Paid</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Pending</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400">Loading…</td>
                </tr>
              ) : sliced.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No restaurants found</p>
                  </td>
                </tr>
              ) : sliced.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {r.logoUrl ? (
                        <img src={r.logoUrl} className="w-7 h-7 rounded-lg object-cover border border-gray-100 shrink-0" alt={r.name} />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {r.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.orderCount} orders</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 hidden sm:table-cell">
                    £{r.totalEarned.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    £{r.totalPaid.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className={`text-sm font-bold ${r.pendingBalance > 0 ? "text-amber-600" : "text-green-600"}`}>
                        £{r.pendingBalance.toFixed(2)}
                      </span>
                      {r.unsettledCount > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{r.unsettledCount} unsettled order{r.unsettledCount !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        if (r.pendingBalance <= 0) {
                          toast.error(`${r.name} has no pending balance.`);
                          return;
                        }
                        setSettleTarget(r);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        r.pendingBalance > 0
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {r.pendingBalance > 0 ? "Settle" : "Settled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {total === 0
              ? "No results"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} restaurants`}
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

      {settleTarget && (
        <SettleModal
          restaurant={settleTarget}
          onClose={() => setSettleTarget(null)}
          onSuccess={() => { refresh(); setSettleTarget(null); }}
        />
      )}

      {/* Settlement History */}
      <SettlementHistorySection />
    </div>
  );
}
