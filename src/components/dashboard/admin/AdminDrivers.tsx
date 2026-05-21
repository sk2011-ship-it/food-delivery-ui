"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Search, Plus, RefreshCw, Truck, Mail, Phone,
  X, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, Trash2, Wifi, WifiOff, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DriverItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "banned";
  shipdayCarrierId: string | null;
  createdAt: string;
}

interface DriversResponse {
  drivers: DriverItem[];
  total: number;
  page: number;
  pageSize: number;
}

type LiveStatusMap = Record<string, { isOnShift: boolean; isActive: boolean }>;

interface ShiftDay { day: number; onMinutes: number; events: number; }
interface ShiftLogEntry { id: string; isOnShift: boolean; recordedAt: string; }
interface ShiftLogsResponse { driverName: string; year: number; month: number; days: ShiftDay[]; logs: ShiftLogEntry[]; }

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function ShiftGraph({ driverId }: { driverId: string }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<ShiftLogsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDay(null);
    setLoading(true);
    fetch(`/api/admin/drivers/${driverId}/shift-logs?year=${year}&month=${month}`)
      .then(r => r.json()).then(r => setData(r.data ?? null))
      .catch(() => setData(null)).finally(() => setLoading(false));
  }, [driverId, year, month]);

  const days = data?.days ?? [];
  const maxMinutes = Math.max(...days.map(d => d.onMinutes), 1);

  function intensity(m: number) {
    if (m === 0) return "var(--dash-bg)";
    const p = m / maxMinutes;
    if (p < 0.25) return "#bbf7d0";
    if (p < 0.5)  return "#4ade80";
    if (p < 0.75) return "#16a34a";
    return "#14532d";
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() {
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const cells: Array<ShiftDay | null> = [...Array(firstDayOfWeek).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<ShiftDay | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const totalOnMinutes = days.reduce((s, d) => s + d.onMinutes, 0);
  const totalHours = Math.floor(totalOnMinutes / 60);
  const totalMins  = totalOnMinutes % 60;
  const activeDays = days.filter(d => d.onMinutes > 0).length;

  return (
    <div className="px-5 py-4 space-y-4" style={{ borderTop: "1px solid var(--dash-border)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--dash-text-muted)" }}>Active Days</p>
            <p className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>{activeDays}</p>
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--dash-text-muted)" }}>Total On-Shift</p>
            <p className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
              {totalOnMinutes === 0 ? "—" : `${totalHours > 0 ? totalHours + "h " : ""}${totalMins}m`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--dash-text-muted)" }} />
          </button>
          <span className="text-sm font-semibold px-2 min-w-[90px] text-center" style={{ color: "var(--dash-text-primary)" }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4" style={{ color: "var(--dash-text-muted)" }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--dash-text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--dash-text-muted)" }}>Loading activity…</span>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-center text-[10px] font-medium" style={{ color: "var(--dash-text-muted)" }}>{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((cell, di) => {
                  if (!cell) return <div key={di} className="aspect-square rounded-sm" />;
                  const isToday    = isCurrentMonth && cell.day === now.getDate();
                  const isSelected = selectedDay === cell.day;
                  const hrs  = Math.floor(cell.onMinutes / 60);
                  const mins = cell.onMinutes % 60;
                  const tip  = cell.onMinutes > 0
                    ? `${cell.day} ${MONTH_NAMES[month-1]}: ${hrs > 0 ? hrs + "h " : ""}${mins}m — click for details`
                    : `${cell.day} ${MONTH_NAMES[month-1]}: No activity`;
                  return (
                    <div key={di} title={tip}
                      onClick={() => setSelectedDay(isSelected ? null : cell.day)}
                      className={`aspect-square rounded-sm flex items-center justify-center cursor-pointer hover:brightness-90 transition-all
                        ${isToday    ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                        ${isSelected ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                      style={{ background: intensity(cell.onMinutes) }}
                    >
                      <span className="text-[9px] font-medium select-none" style={{ color: cell.onMinutes > 0 ? "rgba(255,255,255,0.85)" : "var(--dash-text-muted)" }}>
                        {cell.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[10px]" style={{ color: "var(--dash-text-muted)" }}>Less</span>
            {(["var(--dash-bg)", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"] as const).map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c, border: "1px solid rgba(0,0,0,0.1)" }} />
            ))}
            <span className="text-[10px]" style={{ color: "var(--dash-text-muted)" }}>More</span>
          </div>

          {/* Day detail panel */}
          {selectedDay !== null && (() => {
            const dayLogs = (data?.logs ?? []).filter(l => new Date(l.recordedAt).getDate() === selectedDay);
            const dayData = days.find(d => d.day === selectedDay);
            const hrs  = Math.floor((dayData?.onMinutes ?? 0) / 60);
            const mins = (dayData?.onMinutes ?? 0) % 60;
            return (
              <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: "var(--dash-text-primary)" }}>
                    {selectedDay} {MONTH_NAMES[month - 1]} {year} — Activity
                  </p>
                  <div className="flex items-center gap-3">
                    {dayData && dayData.onMinutes > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        {hrs > 0 ? `${hrs}h ` : ""}{mins}m total on shift
                      </span>
                    )}
                    <button onClick={() => setSelectedDay(null)} className="p-1 rounded hover:bg-black/10">
                      <X className="w-3.5 h-3.5" style={{ color: "var(--dash-text-muted)" }} />
                    </button>
                  </div>
                </div>

                {dayLogs.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>No shift events recorded for this day.</p>
                ) : (
                  <div className="space-y-0">
                    {dayLogs.map((log, i) => {
                      const t = new Date(log.recordedAt);
                      const timeStr = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                      // Calculate duration to next event if this is an ON event
                      const nextLog = dayLogs[i + 1];
                      const duration = log.isOnShift && nextLog && !nextLog.isOnShift
                        ? Math.round((new Date(nextLog.recordedAt).getTime() - t.getTime()) / 60000)
                        : null;
                      return (
                        <div key={log.id} className="flex items-start gap-3">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${log.isOnShift ? "bg-green-500" : "bg-gray-400"}`} />
                            {i < dayLogs.length - 1 && <div className="w-px flex-1 min-h-[20px]" style={{ background: "var(--dash-border)" }} />}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${log.isOnShift ? "text-green-600" : "text-gray-500"}`}>
                                {log.isOnShift ? "Went On Shift" : "Went Off Shift"}
                              </span>
                              {duration !== null && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                                  {duration >= 60 ? `${Math.floor(duration/60)}h ${duration%60}m` : `${duration}m`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-muted)" }}>{timeStr}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

interface SyncResult {
  synced:   number;
  imported: number;
  total:    number;
  message:  string;
  importedDrivers?: Array<{ name: string; email: string; tempPassword: string; carrierId: number }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDrivers() {
  const [drivers, setDrivers]       = useState<DriverItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const pageSize                    = 20;
  const [search, setSearch]         = useState("");
  const debouncedSearch             = useDebounce(search);
  const [loading, setLoading]       = useState(true);
  const [fetching, setFetching]     = useState(false);
  const [syncing, setSyncing]       = useState(false);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState({ name: "", email: "", phone: "", password: "" });
  const [showPass, setShowPass]     = useState(false);
  // Shipday temp password revealed after creation
  const [shipdayCredentials, setShipdayCredentials] = useState<{ email: string; password: string } | null>(null);
  // Imported drivers revealed after sync
  const [syncImported, setSyncImported] = useState<SyncResult["importedDrivers"]>(undefined);

  // Live Shipday status
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [liveLoading, setLiveLoading] = useState(false);

  // Expanded row for shift graph
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<DriverItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDrivers = useCallback(async (p = page, isInitial = false) => {
    isInitial ? setLoading(true) : setFetching(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page:   String(p),
        limit:  String(pageSize),
      });
      const res  = await fetch(`/api/admin/drivers?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load drivers.");
      const data: DriversResponse = json.data;
      setDrivers(data.drivers);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load drivers.");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchDrivers(page, loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // ── Live Status ────────────────────────────────────────────────────────────

  const fetchLiveStatus = useCallback(async () => {
    setLiveLoading(true);
    try {
      const res  = await fetch("/api/admin/drivers/live-status");
      const json = await res.json();
      if (res.ok) setLiveStatus(json.data ?? {});
    } catch {
      // silent — live status is non-critical
    } finally {
      setLiveLoading(false);
    }
  }, []);

  // Poll live status every 30s — Shipday has no shift-change webhook,
  // so polling GET /carriers is the only way to get current isOnShift.
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/drivers/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete driver.");
      setDrivers((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      setDeleteTarget(null);
      toast.success(`Driver "${deleteTarget.name}" deleted.`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete driver.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Sync ───────────────────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res  = await fetch("/api/admin/drivers/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed.");
      const result: SyncResult = json.data;
      toast.success(result.message);
      fetchDrivers(page);
      fetchLiveStatus();
      if (result.importedDrivers && result.importedDrivers.length > 0) {
        setSyncImported(result.importedDrivers);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      toast.error("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setCreating(true);
    try {
      const res  = await fetch("/api/admin/drivers", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create driver.");

      const { driver, shipdayPassword } = json.data;
      setDrivers((prev) => [driver, ...prev]);
      setTotal((t) => t + 1);
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", password: "" });

      // Show Shipday credentials so admin can hand them to the driver
      if (shipdayPassword) {
        setShipdayCredentials({ email: driver.email, password: shipdayPassword });
      }
      toast.success(`Driver "${driver.name}" created successfully.`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create driver.");
    } finally {
      setCreating(false);
    }
  };

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--dash-text-primary)" }}>Drivers</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-muted)" }}>
            Manage delivery drivers — synced with Shipday
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ color: "var(--dash-text-primary)", background: "var(--dash-card)" }}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Shipday"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--dash-accent)" }}
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{ background: "var(--dash-card)" }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-muted)" }} />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--dash-text-primary)" }}
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X className="w-4 h-4" style={{ color: "var(--dash-text-muted)" }} />
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border"
        style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)", opacity: fetching ? 0.6 : 1, transition: "opacity .15s" }}
      >
        {loading ? (
          <div className="divide-y" style={{ borderColor: "var(--dash-border)" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-48 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Truck className="w-10 h-10" style={{ color: "var(--dash-text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--dash-text-muted)" }}>
              {search ? "No drivers match your search." : "No drivers yet. Add your first driver."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
                    {["Driver", "Contact", "Shipday ID", "Live Status", "Joined", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--dash-text-muted)" }}
                      >
                        {h === "Live Status" ? (
                          <span className="flex items-center gap-1">
                            {h}
                            {liveLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                          </span>
                        ) : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--dash-border)" }}>
                  {drivers.map((driver) => {
                    const live = driver.shipdayCarrierId ? liveStatus[driver.shipdayCarrierId] : undefined;
                    const isExpanded = expandedDriver === driver.id;
                    return (
                    <Fragment key={driver.id}>
                    <tr
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedDriver(isExpanded ? null : driver.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ background: "var(--dash-accent)" }}
                          >
                            {driver.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium" style={{ color: "var(--dash-text-primary)" }}>
                              {driver.name}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "var(--dash-text-muted)" }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--dash-text-muted)" }}>
                            <Mail className="w-3 h-3" />
                            {driver.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--dash-text-muted)" }}>
                            <Phone className="w-3 h-3" />
                            {driver.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {driver.shipdayCarrierId ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            <CheckCircle2 className="w-3 h-3" />
                            #{driver.shipdayCarrierId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                            <AlertCircle className="w-3 h-3" />
                            Not synced
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {live === undefined ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">
                            —
                          </span>
                        ) : live.isOnShift ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                            <Wifi className="w-3 h-3" />
                            On Shift
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                            <WifiOff className="w-3 h-3" />
                            Off Shift
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: "var(--dash-text-muted)" }}>
                        {new Date(driver.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setDeleteTarget(driver)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                          title="Delete driver"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <ShiftGraph driverId={driver.id} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "var(--dash-border)" }}>
              {drivers.map((driver) => {
                const live = driver.shipdayCarrierId ? liveStatus[driver.shipdayCarrierId] : undefined;
                return (
                <div key={driver.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: "var(--dash-accent)" }}
                      >
                        {driver.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>{driver.name}</p>
                        <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>{driver.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {live !== undefined && (
                        live.isOnShift ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">
                            <Wifi className="w-2.5 h-2.5" /> On Shift
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                            <WifiOff className="w-2.5 h-2.5" /> Off Shift
                          </span>
                        )
                      )}
                      <button onClick={() => setDeleteTarget(driver)} className="p-1 rounded-lg hover:bg-red-50 group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {driver.shipdayCarrierId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Shipday #{driver.shipdayCarrierId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Not synced
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--dash-text-muted)" }}>
            {total} driver{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border disabled:opacity-40 transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--dash-border)", color: "var(--dash-text-primary)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm px-3" style={{ color: "var(--dash-text-primary)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border disabled:opacity-40 transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--dash-border)", color: "var(--dash-text-primary)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Create Driver Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--dash-text-primary)" }}>Add New Driver</h2>
              <button
                onClick={() => { setShowCreate(false); setForm({ name: "", email: "", phone: "", password: "" }); }}
                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--dash-text-muted)" }} />
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
              This will create the driver in our system <strong>and</strong> in Shipday. The driver will receive a Shipday account to log into the <strong>Shipday Drive</strong> app.
            </p>

            <div className="space-y-3">
              {(["name", "email", "phone"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold mb-1 capitalize" style={{ color: "var(--dash-text-muted)" }}>
                    {field}
                  </label>
                  <input
                    type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={field === "name" ? "Full name" : field === "email" ? "driver@example.com" : "+447700123456"}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: "var(--dash-bg)", borderColor: "var(--dash-border)", color: "var(--dash-text-primary)" }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--dash-text-muted)" }}>
                  Password (for app login)
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: "var(--dash-bg)", borderColor: "var(--dash-border)", color: "var(--dash-text-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPass
                      ? <EyeOff className="w-4 h-4" style={{ color: "var(--dash-text-muted)" }} />
                      : <Eye className="w-4 h-4" style={{ color: "var(--dash-text-muted)" }} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCreate(false); setForm({ name: "", email: "", phone: "", password: "" }); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-black/5"
                style={{ borderColor: "var(--dash-border)", color: "var(--dash-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--dash-accent)" }}
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Driver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>Delete Driver</h2>
                <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>This cannot be undone</p>
              </div>
            </div>

            <p className="text-sm" style={{ color: "var(--dash-text-primary)" }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              This will remove them from your system <strong>and</strong> from Shipday.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-black/5 disabled:opacity-50"
                style={{ borderColor: "var(--dash-border)", color: "var(--dash-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : "Delete Driver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sync Imported Drivers Modal ────────────────────────────────────── */}
      {syncImported && syncImported.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>
                  {syncImported.length} Driver{syncImported.length !== 1 ? "s" : ""} Imported from Shipday
                </h2>
                <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>Share these login credentials with each driver</p>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {syncImported.map((d) => (
                <div
                  key={d.email}
                  className="rounded-xl p-3 space-y-1.5 text-sm"
                  style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-border)" }}
                >
                  <p className="font-semibold text-xs" style={{ color: "var(--dash-text-primary)" }}>{d.name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--dash-text-muted)" }}>Email</span>
                    <span className="font-mono" style={{ color: "var(--dash-text-primary)" }}>{d.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--dash-text-muted)" }}>Temp Password</span>
                    <span className="font-mono font-semibold bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded">{d.tempPassword}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--dash-text-muted)" }}>Shipday ID</span>
                    <span className="font-mono" style={{ color: "var(--dash-text-primary)" }}>#{d.carrierId}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
              These drivers were found in Shipday and imported into your system. They can log in to the app with the above credentials.
            </p>

            <button
              onClick={() => setSyncImported(undefined)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--dash-accent)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Shipday Credentials Modal ──────────────────────────────────────── */}
      {shipdayCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>Driver Created!</h2>
                <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>Share these Shipday credentials with the driver</p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 space-y-2 text-sm"
              style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-border)" }}
            >
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--dash-text-muted)" }}>Shipday Drive App Login</p>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--dash-text-muted)" }}>Email</span>
                <span className="font-mono font-semibold text-xs" style={{ color: "var(--dash-text-primary)" }}>{shipdayCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--dash-text-muted)" }}>Temp Password</span>
                <span className="font-mono font-semibold text-xs bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded">
                  {shipdayCredentials.password}
                </span>
              </div>
            </div>

            <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
              The driver should download <strong>Shipday Drive</strong> from the App Store and log in with the above credentials. They will be prompted to change the password.
            </p>

            <button
              onClick={() => setShipdayCredentials(null)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--dash-accent)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
