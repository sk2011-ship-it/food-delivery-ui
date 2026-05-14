"use client";

import { useEffect, useState, useRef } from "react";
import {
  Clock, TrendingUp, AlertCircle, PoundSterling,
  Timer, ChefHat, Truck, CheckCircle2, XCircle, RefreshCw,
  User, Search, X, CalendarDays,
} from "lucide-react";
import StatCard from "@/components/dashboard/shared/StatCard";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function pct(numerator: number, denominator: number): string {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Last 12 months including current
function buildMonthOptions() {
  const opts: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    opts.push({ label, value });
  }
  return opts;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PlatformStats = {
  totalOrders: number;
  acceptedOrders: number;
  timedOutOrders: number;
  ownerRejectedOrders: number;
  customerCancelledOrders: number;
  avgWaitTimeMs: number;
  avgPaymentDelayMs: number;
  avgKitchenTimeMs: number;
  avgDeliveryTimeMs: number;
  avgTotalFulfillmentMs: number;
  revenueLost: number;
};

type RestaurantRow = {
  restaurantId: string;
  name: string;
  totalOrders: number;
  acceptedOrders: number;
  timedOutOrders: number;
  avgWaitTimeMs: number | null;
};

type HourlyRow   = { hour: number; orderCount: number; avgWaitTimeMs: number | null; timeoutCount: number };
type DailyRow    = { day: number; orderCount: number; avgWaitTimeMs: number | null; timeoutCount: number };
type MonthlyRow  = { month: string; orderCount: number; acceptedCount: number; timeoutCount: number; avgWaitTimeMs: number | null };
type CustomerHit = { userId: string; name: string; email: string };

type MetricsData = {
  platform: PlatformStats;
  restaurants: RestaurantRow[];
  hourly: HourlyRow[];
  daily: DailyRow[];
  monthlyTrend: MonthlyRow[];
  customerProfile: { id: string; name: string; email: string; phone: string } | null;
  activeFilters: { month: string | null; userId: string | null };
};

// ── Mini bar ──────────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${w}%` }} />
    </div>
  );
}

// ── Customer search dropdown ──────────────────────────────────────────────────

function CustomerSearch({
  onSelect,
  onClear,
  selected,
}: {
  onSelect: (c: CustomerHit) => void;
  onClear: () => void;
  selected: { name: string; email: string } | null;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (val: string) => {
    setSearching(true);
    try {
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/admin/metrics?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: session?.access_token ? `Bearer ${session.access_token}` : "" },
      });
      const json = await res.json();
      setResults(json.data?.customers ?? []);
      setOpen(true);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 300);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm">
        <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-blue-900 truncate text-xs">{selected.name}</p>
          <p className="text-[10px] text-blue-500 truncate">{selected.email}</p>
        </div>
        <button onClick={onClear} className="ml-auto p-0.5 hover:bg-blue-100 rounded-lg transition-all shrink-0">
          <X className="w-3.5 h-3.5 text-blue-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          value={q}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder="Search customer by name or email…"
          className="flex-1 text-xs outline-none bg-transparent placeholder-gray-400 min-w-0"
        />
        {searching && <RefreshCw className="w-3 h-3 text-gray-400 animate-spin shrink-0" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map(c => (
            <button
              key={c.userId}
              onClick={() => { onSelect(c); setOpen(false); setQ(""); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                {c.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Monthly trend chart ───────────────────────────────────────────────────────

function MonthlyTrend({ rows }: { rows: MonthlyRow[] }) {
  if (rows.length === 0) return (
    <p className="text-xs text-gray-400 py-4 text-center">No monthly data yet.</p>
  );

  const maxCount = Math.max(...rows.map(r => r.orderCount), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-max px-1 pb-1" style={{ height: 120 }}>
        {rows.map(row => {
          const barH = Math.max((row.orderCount / maxCount) * 90, row.orderCount > 0 ? 6 : 0);
          const acceptRate = row.orderCount > 0 ? Math.round((row.acceptedCount / row.orderCount) * 100) : 0;
          return (
            <div key={row.month} className="flex flex-col items-center gap-1 group relative w-12 shrink-0">
              {/* Tooltip */}
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center pointer-events-none">
                <p className="font-bold">{row.month}</p>
                <p>{row.orderCount} orders · {acceptRate}% accepted</p>
                {row.avgWaitTimeMs ? <p>Avg wait: {fmtMs(row.avgWaitTimeMs)}</p> : null}
                {row.timeoutCount > 0 ? <p className="text-amber-300">{row.timeoutCount} timeouts</p> : null}
              </div>
              {/* Bar stack: accepted (blue) + timed out (amber) */}
              <div className="w-full flex flex-col justify-end rounded-sm overflow-hidden bg-gray-100" style={{ height: 90 }}>
                <div
                  className="w-full bg-blue-400 transition-all"
                  style={{ height: `${barH * (acceptRate / 100)}%` }}
                />
                {row.timeoutCount > 0 && (
                  <div
                    className="w-full bg-amber-400"
                    style={{ height: `${barH * (row.timeoutCount / row.orderCount)}%` }}
                  />
                )}
              </div>
              <span className="text-[9px] text-gray-400 leading-tight text-center">
                {row.month.slice(5)}/{row.month.slice(2, 4)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span className="text-[10px] text-gray-500">Accepted</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-amber-400" /><span className="text-[10px] text-gray-500">Timed out</span></div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const [data, setData]           = useState<MetricsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [month, setMonth]         = useState<string>("");            // "" = all time
  const [userId, setUserId]       = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; email: string } | null>(null);
  const [sortBy, setSortBy]       = useState<"totalOrders" | "avgWaitTimeMs" | "timedOutOrders">("totalOrders");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");

  const MONTH_OPTIONS = buildMonthOptions();

  const buildUrl = (m: string, u: string) => {
    const p = new URLSearchParams();
    if (m) p.set("month", m);
    if (u) p.set("userId", u);
    return `/api/admin/metrics${p.toString() ? "?" + p.toString() : ""}`;
  };

  const fetchMetrics = async (m = month, u = userId) => {
    setLoading(true);
    try {
      const session = useAuthStore.getState().session;
      const res = await fetch(buildUrl(m, u), {
        headers: { Authorization: session?.access_token ? `Bearer ${session.access_token}` : "" },
      });
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (err) {
      console.error("[AdminAnalytics]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const handleMonthChange = (m: string) => {
    setMonth(m);
    fetchMetrics(m, userId);
  };

  const handleCustomerSelect = (c: CustomerHit) => {
    setUserId(c.userId);
    setSelectedCustomer({ name: c.name, email: c.email });
    fetchMetrics(month, c.userId);
  };

  const handleCustomerClear = () => {
    setUserId("");
    setSelectedCustomer(null);
    fetchMetrics(month, "");
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const sortedRestaurants = data
    ? [...data.restaurants].sort((a, b) => {
        const av = (a[sortBy] ?? 0) as number;
        const bv = (b[sortBy] ?? 0) as number;
        return sortDir === "desc" ? bv - av : av - bv;
      })
    : [];

  const maxHourlyOrders = data ? Math.max(...data.hourly.map(h => h.orderCount), 1) : 1;
  const maxDailyOrders  = data ? Math.max(...data.daily.map(d => d.orderCount), 1)  : 1;
  const p = data?.platform;

  const isFiltered = !!(month || userId);

  return (
    <div>
      <PageHeader
        title="Order Analytics"
        subtitle="Customer wait times, restaurant acceptance speed, and platform health"
      />

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* Month picker */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl flex-1 max-w-[220px]">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={month}
            onChange={e => handleMonthChange(e.target.value)}
            className="flex-1 text-xs outline-none bg-transparent text-gray-700"
          >
            <option value="">All time</option>
            {MONTH_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Customer search */}
        <div className="flex-1 max-w-sm">
          <CustomerSearch
            selected={selectedCustomer}
            onSelect={handleCustomerSelect}
            onClear={handleCustomerClear}
          />
        </div>

        {/* Active filter badges + refresh */}
        <div className="flex items-center gap-2 ml-auto">
          {isFiltered && (
            <button
              onClick={() => { setMonth(""); handleCustomerClear(); fetchMetrics("", ""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
          <button
            onClick={() => fetchMetrics()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Customer profile banner ─────────────────────────────────────── */}
      {data?.customerProfile && (
        <div className="flex items-center gap-4 px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {data.customerProfile.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">{data.customerProfile.name}</p>
            <p className="text-xs text-gray-500">{data.customerProfile.email} · {data.customerProfile.phone}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-white px-3 py-1.5 rounded-lg border border-blue-100">
            <User className="w-3 h-3" /> Viewing customer data
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading metrics…</div>
      ) : !data ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">No data yet. Metrics populate as orders are placed.</div>
      ) : (
        <div className="space-y-8">

          {/* ── Stat cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Orders" value={String(p!.totalOrders)} icon={TrendingUp} color="blue" />
            <StatCard label="Acceptance Rate" value={pct(p!.acceptedOrders, p!.totalOrders)} icon={CheckCircle2} color="green" />
            <StatCard label="Timeout Rate" value={pct(p!.timedOutOrders, p!.totalOrders)} icon={AlertCircle} color="amber" />
            <StatCard label="Revenue Lost (Timeouts)" value={`£${parseFloat(String(p!.revenueLost)).toFixed(2)}`} icon={PoundSterling} color="red" />
          </div>

          {/* ── Average timings ─────────────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Average Timings</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Customer Wait Time",     ms: p!.avgWaitTimeMs,       icon: Clock,   color: "amber"  as const, desc: "Order placed → Owner accepts" },
                { label: "Customer Payment Speed", ms: p!.avgPaymentDelayMs,   icon: Timer,   color: "blue"   as const, desc: "Confirmed → Customer pays" },
                { label: "Kitchen Prep Time",      ms: p!.avgKitchenTimeMs,    icon: ChefHat, color: "purple" as const, desc: "Paid → Out for delivery" },
                { label: "Delivery Time",          ms: p!.avgDeliveryTimeMs,   icon: Truck,   color: "green"  as const, desc: "Dispatched → Delivered" },
              ].map(({ label, ms, icon: Icon, color, desc }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("p-2 rounded-lg", {
                      "bg-amber-50 text-amber-600": color === "amber",
                      "bg-blue-50 text-blue-600": color === "blue",
                      "bg-purple-50 text-purple-600": color === "purple",
                      "bg-green-50 text-green-600": color === "green",
                    })}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500">{label}</p>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{fmtMs(ms)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Monthly trend ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                {userId ? "This Customer's Order History" : "Month-by-Month Trend"}
              </h2>
              <span className="text-[10px] text-gray-400">Hover bars for details</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <MonthlyTrend rows={data.monthlyTrend} />
            </div>
          </div>

          {/* ── Cancellation breakdown ───────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Cancellation Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Timed Out",          count: p!.timedOutOrders,          color: "bg-amber-500" },
                { label: "Owner Rejected",     count: p!.ownerRejectedOrders,      color: "bg-red-500" },
                { label: "Customer Cancelled", count: p!.customerCancelledOrders,  color: "bg-gray-400" },
              ].map(({ label, count, color }) => {
                const total = (p!.timedOutOrders + p!.ownerRejectedOrders + p!.customerCancelledOrders) || 1;
                return (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500">{label}</p>
                      <span className="text-xs font-bold text-gray-400">{pct(count, total)}</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 mb-3">{count}</p>
                    <MiniBar value={count} max={total} color={color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Restaurant performance table ─────────────────────────────── */}
          {!userId && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Restaurant Performance {month ? `— ${MONTH_OPTIONS.find(o => o.value === month)?.label}` : ""}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500">Restaurant</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort("totalOrders")}>
                          Orders {sortBy === "totalOrders" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500">Acceptance</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort("avgWaitTimeMs")}>
                          Avg Wait {sortBy === "avgWaitTimeMs" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort("timedOutOrders")}>
                          Timeouts {sortBy === "timedOutOrders" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedRestaurants.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-xs">No data.</td></tr>
                      ) : sortedRestaurants.map(r => {
                        const rate = r.totalOrders > 0 ? Math.round((r.acceptedOrders / r.totalOrders) * 100) : 0;
                        const toRate = r.totalOrders > 0 ? Math.round((r.timedOutOrders / r.totalOrders) * 100) : 0;
                        return (
                          <tr key={r.restaurantId ?? r.name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-gray-900">{r.name ?? "Unknown"}</td>
                            <td className="px-5 py-3.5 text-gray-700">{r.totalOrders}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-bold", rate >= 80 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600")}>{rate}%</span>
                                <div className="w-16"><MiniBar value={rate} max={100} color={rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500"} /></div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cn("text-xs font-bold", !r.avgWaitTimeMs ? "text-gray-400" : r.avgWaitTimeMs < 120000 ? "text-green-600" : r.avgWaitTimeMs < 300000 ? "text-amber-600" : "text-red-600")}>
                                {fmtMs(r.avgWaitTimeMs)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cn("text-xs font-bold", toRate === 0 ? "text-gray-400" : toRate < 10 ? "text-amber-500" : "text-red-600")}>
                                {r.timedOutOrders} <span className="text-gray-400 font-normal">({toRate}%)</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Hourly + Daily ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Orders by Hour of Day</h3>
              <p className="text-[11px] text-gray-400 mb-4">When orders are placed most</p>
              <div className="flex items-end gap-1 h-24">
                {Array.from({ length: 24 }, (_, h) => {
                  const row = data.hourly.find(r => r.hour === h);
                  const cnt = row?.orderCount ?? 0;
                  const hp = maxHourlyOrders > 0 ? (cnt / maxHourlyOrders) * 100 : 0;
                  const hasTimeout = (row?.timeoutCount ?? 0) > 0;
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {h}:00 · {cnt}{row?.avgWaitTimeMs ? ` · ${fmtMs(row.avgWaitTimeMs)}` : ""}
                      </div>
                      <div className={cn("w-full rounded-sm", hasTimeout ? "bg-amber-400" : "bg-blue-400")} style={{ height: `${Math.max(hp, cnt > 0 ? 4 : 0)}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-400">12am</span>
                <span className="text-[9px] text-gray-400">12pm</span>
                <span className="text-[9px] text-gray-400">11pm</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-400" /><span className="text-[10px] text-gray-500">Normal</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-400" /><span className="text-[10px] text-gray-500">Has timeouts</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Orders by Day of Week</h3>
              <p className="text-[11px] text-gray-400 mb-4">Busiest days and avg wait</p>
              <div className="space-y-2">
                {DAY_LABELS.map((label, idx) => {
                  const row = data.daily.find(d => d.day === idx);
                  const cnt = row?.orderCount ?? 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 w-8">{label}</span>
                      <div className="flex-1"><MiniBar value={cnt} max={maxDailyOrders} color="bg-blue-400" /></div>
                      <span className="text-xs text-gray-700 font-semibold w-6 text-right">{cnt}</span>
                      <span className="text-[10px] w-10 text-right font-medium" style={{ color: row?.avgWaitTimeMs && row.avgWaitTimeMs > 300000 ? "#f59e0b" : "#9ca3af" }}>
                        {row?.avgWaitTimeMs ? fmtMs(row.avgWaitTimeMs) : "—"}
                      </span>
                      {(row?.timeoutCount ?? 0) > 0 && (
                        <span className="text-[10px] text-amber-500 font-bold w-6">{row!.timeoutCount}✗</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">orders · avg wait · timeouts</p>
            </div>
          </div>

          {/* ── End-to-end funnel ────────────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">End-to-End Fulfillment</h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-0">
                {[
                  { label: "Placed",    time: null,                  color: "bg-gray-200 text-gray-600" },
                  { label: "Accepted",  time: p!.avgWaitTimeMs,      color: "bg-amber-100 text-amber-700" },
                  { label: "Paid",      time: p!.avgPaymentDelayMs,  color: "bg-blue-100 text-blue-700" },
                  { label: "Prepared",  time: p!.avgKitchenTimeMs,   color: "bg-purple-100 text-purple-700" },
                  { label: "Delivered", time: p!.avgDeliveryTimeMs,  color: "bg-green-100 text-green-700" },
                ].map(({ label, time, color }, i, arr) => (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold text-center w-full max-w-[90px]", color)}>{label}</div>
                      {time ? <span className="text-[10px] text-gray-400 mt-1">{fmtMs(time)}</span> : <span className="text-[10px] text-transparent mt-1">·</span>}
                    </div>
                    {i < arr.length - 1 && <div className="text-gray-300 text-xs mx-0.5">→</div>}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-4 text-center">
                Avg total: <span className="font-bold text-gray-700">{fmtMs(p!.avgTotalFulfillmentMs)}</span>
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
