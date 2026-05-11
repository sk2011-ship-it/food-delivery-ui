"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, MoreVertical, Trash2, X, ChevronDown, 
  ChevronLeft, ChevronRight, RefreshCw, Building2,
  Mail, Phone, AlertTriangle, Loader2, Clock, Calendar
} from "lucide-react";
import { 
  restaurantApi, 
  type AdminRestaurantItem, 
  type RestaurantStatus 
} from "@/lib/api";
import { locationTheme } from "@/lib/locations";
import { toast } from "sonner";

/* ── Constants ── */
const STATUS_META: Record<RestaurantStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "#f0fdf4" },
  inactive:  { label: "Inactive",  color: "#6b7280", bg: "#f3f4f6" },
  suspended: { label: "Suspended", color: "#ef4444", bg: "#fef2f2" },
};

/* ── Types ── */
interface DeletionFilters {
  search: string;
  page: number;
  pageSize: number;
}

export default function AdminDeletions() {
  const [data, setData] = useState<{ restaurants: AdminRestaurantItem[]; total: number }>({
    restaurants: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState<DeletionFilters>({
    search: "",
    page: 1,
    pageSize: 10
  });

  const [menuId, setMenuId] = useState<string | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<AdminRestaurantItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await restaurantApi.list({
        search: filters.search,
        page: 1,
        limit: 100,
        includeDeletions: true,
      });
      
      if (res.success && res.data) {
        const pending = res.data.restaurants.filter(r => 
          r.deletionStatus === "PENDING_DELETION" || r.deletionStatus === "DELETED"
        );
        
        setData({ 
          restaurants: pending,
          total: pending.length
        });
      } else {
        toast.error(res.error ?? "Failed to load deletion requests.");
      }
    } catch (err) {
      console.error("[AdminDeletions] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProcessDeletions = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/cron/process-restaurant-deletions");
      const json = await res.json();
      if (res.ok) {
        toast.success(`Cleanup complete. ${json.data?.processed ?? 0} restaurants processed.`);
        fetchData();
      } else {
        toast.error(json.error || "Failed to process deletions.");
      }
    } catch (err) {
      toast.error("An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceDelete = async () => {
    if (!forceDeleteTarget) return;
    setSaving(true);
    try {
      const res = await restaurantApi.forceDelete(forceDeleteTarget.id);
      if (res.success) {
        toast.success("Restaurant permanently removed.");
        setData(d => ({
          total: d.total - 1,
          restaurants: d.restaurants.filter(r => r.id !== forceDeleteTarget.id)
        }));
        setForceDeleteTarget(null);
      } else {
        toast.error(res.error ?? "Failed to force delete.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
            Deletion Requests
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            {loading ? "Loading…" : `${data.total} requests in the 14-day grace period`}
          </p>
        </div>
        <button
          onClick={handleProcessDeletions}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0 disabled:opacity-50"
          style={{ background: "var(--dash-accent)" }}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isProcessing ? "Processing..." : "Run Cleanup Job"}
        </button>
      </div>

      {/* ── Table Container ── */}
      <div
        className="rounded-2xl border"
        style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
      >
        {/* Header - Desktop */}
        <div
          className="hidden sm:grid sm:grid-cols-[2fr_1fr_1.3fr_1.8fr_44px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--dash-text-secondary)", borderBottom: "1px solid var(--dash-card-border)" }}
        >
          <span>Restaurant</span>
          <span>Location</span>
          <span>Owner</span>
          <span>Deletion Timeline</span>
          <span />
        </div>

        {loading ? (
          <div className="divide-y" style={{ borderColor: "var(--dash-card-border)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "var(--dash-bg)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded" style={{ background: "var(--dash-bg)" }} />
                  <div className="h-3 w-44 rounded" style={{ background: "var(--dash-bg)" }} />
                </div>
                <div className="h-6 w-20 rounded-full hidden sm:block" style={{ background: "var(--dash-bg)" }} />
              </div>
            ))}
          </div>
        ) : data.restaurants.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>No deletion requests</p>
            <p className="text-sm mt-1" style={{ color: "var(--dash-text-secondary)" }}>The system is currently clear.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--dash-card-border)" }}>
            {data.restaurants.map((r) => {
              const sm = STATUS_META[r.status] || STATUS_META.inactive;
              const requestedAt = r.deletionRequestedAt ? new Date(r.deletionRequestedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "—";
              const scheduledAt = r.deletionScheduledAt ? new Date(r.deletionScheduledAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }) : "—";
              const daysLeft = r.deletionScheduledAt 
                ? Math.ceil((new Date(r.deletionScheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <div key={r.id} className="px-5 py-4 hover:bg-black/[0.015] transition-colors relative">
                  <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1.3fr_1.8fr_44px] gap-4 items-center">
                    {/* Entity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <LogoAvatar logoUrl={r.logoUrl} name={r.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{r.name}</p>
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ color: sm.color, background: sm.bg }}>
                          {sm.label}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="min-w-0">
                      {r.location ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold truncate"
                          style={{ color: locationTheme(r.location).color, background: locationTheme(r.location).bg }}
                        >
                          {r.location}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>

                    {/* Owner */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--dash-text-primary)" }}>{r.ownerName ?? "—"}</p>
                      <p className="text-xs truncate" style={{ color: "var(--dash-text-secondary)" }}>{r.ownerEmail}</p>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-gray-400">
                          <Calendar className="w-3 h-3" /> Requested {requestedAt}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold mt-0.5" style={{ color: "var(--dash-text-primary)" }}>
                          <Clock className="w-3 h-3 text-amber-500" /> Expiry: {scheduledAt}
                        </div>
                      </div>

                      {/* Circular Badge - Matching user screenshot */}
                      <div className="w-16 h-16 rounded-full border-2 border-amber-200 bg-amber-50 flex flex-col items-center justify-center text-center shrink-0 p-1 shadow-sm">
                        <p className="text-[8px] font-black leading-none text-amber-600 uppercase">Deletion</p>
                        <p className="text-[12px] font-black text-amber-700 leading-tight my-0.5">IN {daysLeft}</p>
                        <p className="text-[8px] font-black leading-none text-amber-600 uppercase">Days</p>
                      </div>
                    </div>

                    {/* Action */}
                    <ActionMenu
                      menuOpen={menuId === r.id}
                      onToggle={() => setMenuId(menuId === r.id ? null : r.id)}
                      onForceDelete={() => { setForceDeleteTarget(r); setMenuId(null); }}
                      isDeleted={r.deletionStatus === "DELETED"}
                    />
                  </div>

                  {/* Mobile View */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <LogoAvatar logoUrl={r.logoUrl} name={r.name} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>{r.name}</p>
                          <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>{r.ownerName}</p>
                        </div>
                      </div>
                      <ActionMenu
                        menuOpen={menuId === r.id}
                        onToggle={() => setMenuId(menuId === r.id ? null : r.id)}
                        onForceDelete={() => { setForceDeleteTarget(r); setMenuId(null); }}
                        isDeleted={r.deletionStatus === "DELETED"}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-amber-600">Expires {scheduledAt}</span>
                       <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">
                         {daysLeft} Days Left
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Force Delete Modal */}
      {forceDeleteTarget && (
        <Modal 
          title="Confirm Force Delete" 
          onClose={() => setForceDeleteTarget(null)}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        >
          <div className="p-6">
            <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
              Are you sure you want to <strong className="text-red-600 uppercase tracking-wider">Force Delete</strong> <strong style={{ color: "var(--dash-text-primary)" }}>{forceDeleteTarget.name}</strong>?
            </p>
            <p className="text-xs mt-3 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100">
              This action bypasses the 14-day grace period and permanently removes the restaurant and its data from the platform immediately.
            </p>

            <div className="flex gap-2 mt-8">
              <button
                onClick={() => setForceDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl text-xs font-bold border transition-all"
                style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleForceDelete}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white transition-all bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Purging...
                  </>
                ) : (
                  "Confirm Force Delete"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Backdrop to close menus */}
      {menuId && <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />}
    </div>
  );
}

/* ── Internal Components ── */

function LogoAvatar({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  return (
    <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-white flex items-center justify-center">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Building2 className="w-5 h-5 text-gray-200" />
      )}
    </div>
  );
}

function ActionMenu({ menuOpen, onToggle, onForceDelete, isDeleted }: {
  menuOpen: boolean; onToggle: () => void; onForceDelete: () => void; isDeleted: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"
      >
        <MoreVertical className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
      </button>
      {menuOpen && (
        <div
          className="absolute right-0 top-8 z-50 w-44 rounded-xl shadow-lg border py-1"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          {!isDeleted ? (
            <button 
              onClick={onForceDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Force Delete Now
            </button>
          ) : (
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase italic">
              Already Processed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, icon }: {
  title: string; onClose: () => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--dash-card-border)" }}>
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-sm font-bold" style={{ color: "var(--dash-text-primary)" }}>{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
