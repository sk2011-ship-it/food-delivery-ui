"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Store, ShoppingBag, Clock, CheckCircle2,
  TrendingUp, FileText, RefreshCw, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = "all" | "7d" | "30d" | "90d";
type StatusFilter = "all" | "PENDING" | "COMPLETED";

interface RestaurantSummary {
  id: string;
  name: string;
  location: string | null;
  totalEarned: number;
  totalSettled: number;
  pendingBalance: number;
  orderCount: number;
}

interface Settlement {
  id: string;
  restaurantId: string;
  restaurantName: string;
  amount: string;
  status: "PENDING" | "COMPLETED";
  transactionId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
  orderCount: number;
  orderIds: string[] | null;
  createdAt: string;
}

interface ReportData {
  restaurants: RestaurantSummary[];
  settlements: Settlement[];
  summary: {
    totalEarned: number;
    totalSettled: number;
    pendingBalance: number;
    orderCount: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Component ───────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "7d",  label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All Settlements" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING",   label: "Pending" },
];

export default function OwnerReports() {
  const [period, setPeriod]         = useState<Period>("all");
  const [status, setStatus]         = useState<StatusFilter>("all");
  const [data, setData]             = useState<ReportData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/owner/reports?period=${period}&status=${status}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load reports");
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments & Settlements"
        subtitle="Your earnings, settlements, and admin notes from the platform"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period filter */}
            <div className="relative">
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as Period)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white outline-none focus:border-gray-400 cursor-pointer"
              >
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            {/* Status filter */}
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StatusFilter)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white outline-none focus:border-gray-400 cursor-pointer"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned", value: summary ? fmt(summary.totalEarned) : "—", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Settled", value: summary ? fmt(summary.totalSettled) : "—", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Balance", value: summary ? fmt(summary.pendingBalance) : "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Orders", value: summary ? summary.orderCount.toString() : "—", icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
            {loading ? (
              <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-black text-gray-900">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Restaurant Earnings Breakdown ─────────────────────────────── */}
      {data && data.restaurants.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Your Restaurants</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.restaurants.map(r => {
              const pct = r.totalEarned > 0 ? Math.round((r.totalSettled / r.totalEarned) * 100) : 0;
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      {r.location && <p className="text-xs text-gray-400 mt-0.5">{r.location}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(r.totalEarned)}</p>
                      <p className="text-xs text-gray-400">{r.orderCount} orders</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Settled: <span className="font-semibold text-gray-900">{fmt(r.totalSettled)}</span></span>
                    <span>Pending: <span className="font-semibold text-amber-600">{fmt(r.pendingBalance)}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Settlements Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Settlement History</h2>
          {data && (
            <span className="ml-auto text-xs text-gray-400 font-medium">{data.settlements.length} record{data.settlements.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : !data || data.settlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">No settlements found</p>
            <p className="text-xs text-gray-400">Settlements will appear here once the admin processes a payment for your restaurant.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.settlements.map(s => {
              const isExpanded = expandedId === s.id;
              const orderCount = s.orderCount > 0 ? s.orderCount : (s.orderIds?.length ?? 0);
              return (
                <div key={s.id}>
                  {/* Clickable main row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Top line: restaurant + status badge */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{s.restaurantName}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          s.status === "COMPLETED"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {s.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {s.status === "COMPLETED" ? "Settled" : "Pending"}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-1.5">
                        {orderCount > 0 && (
                          <span className="font-medium text-gray-700">{orderCount} order{orderCount !== 1 ? "s" : ""} included</span>
                        )}
                        {(s.periodStart || s.periodEnd) && (
                          <span>Period: {fmtDate(s.periodStart)} → {fmtDate(s.periodEnd)}</span>
                        )}
                        {s.transactionId && (
                          <span className="font-mono">Ref: {s.transactionId}</span>
                        )}
                        <span className="text-gray-400">{fmtDate(s.createdAt)}</span>
                      </div>

                      {/* Admin notes */}
                      {s.notes && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-800 leading-relaxed">{s.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: amount + expand toggle */}
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-base font-black text-gray-900">{fmt(parseFloat(s.amount))}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(s.createdAt)}</p>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Expanded order breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-gray-50/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Orders included in this settlement
                      </p>
                      {(!s.orderIds || s.orderIds.length === 0) ? (
                        <p className="text-xs text-gray-400 italic">
                          Order-level detail is not available for this settlement. Contact the platform admin for a breakdown.
                        </p>
                      ) : (
                        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                          <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Order ID</span>
                            <span className="text-right">Ref</span>
                          </div>
                          <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                            {s.orderIds.map(id => (
                              <div key={id} className="grid grid-cols-2 gap-2 px-3 py-2 text-xs items-center">
                                <span className="font-mono text-gray-600">#{id.slice(0, 8).toUpperCase()}</span>
                                <span className="text-right text-gray-400 font-mono text-[10px]">{id.slice(-6).toUpperCase()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100 bg-gray-50">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {s.orderIds.length} orders · Total
                            </span>
                            <span className="text-sm font-black text-gray-900">{fmt(parseFloat(s.amount))}</span>
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
    </div>
  );
}
