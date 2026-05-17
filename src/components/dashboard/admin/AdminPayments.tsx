"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard, TrendingUp, Clock, CheckCircle2,
  Search, ChevronLeft, ChevronRight, ChevronDown,
  Banknote, Info, RefreshCw, X,
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
  const [orders,        setOrders]        = useState<any[]>([]);
  const [fetching,      setFetching]      = useState(true);
  const [notes,         setNotes]         = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    setFetching(true);
    adminPaymentApi
      .getUnpaidOrders(restaurant.id)
      .then((res) => {
        if (res.success) setOrders(res.data?.unpaidOrders || []);
        else toast.error(res.error || "Failed to load unpaid orders");
      })
      .catch(() => toast.error("Internal error fetching orders"))
      .finally(() => setFetching(false));
  }, [restaurant.id]);

  const handleSettle = async () => {
    if (orders.length === 0) { toast.error("No orders to settle."); return; }
    setLoading(true);
    const res = await adminPaymentApi.settle({
      restaurantId: restaurant.id,
      orderIds: orders.map((o: any) => o.id),
      transactionId,
      notes,
    });
    setLoading(false);
    if (res.success) {
      toast.success(`Settled £${restaurant.pendingBalance.toFixed(2)} for ${restaurant.name}`);
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
        {/* Summary */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500 font-medium">Unpaid balance</span>
            <span className="text-lg font-bold text-gray-900">£{restaurant.pendingBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Orders included</span>
            <span className="font-semibold text-gray-700">{restaurant.orderCount}</span>
          </div>
        </div>

        {/* Fields */}
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

        {/* Orders list */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Orders in this payout
          </p>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2 space-y-1.5">
            {fetching ? (
              <p className="py-6 text-center text-xs text-gray-400">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No unpaid orders.</p>
            ) : orders.map((o: any) => (
              <div key={o.id} className="flex justify-between items-center text-xs px-3 py-2 rounded-lg bg-white border border-gray-100">
                <span className="font-mono text-gray-600">#{o.id.slice(0, 8).toUpperCase()}</span>
                <div className="flex gap-4">
                  <span className="text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-gray-800">£{parseFloat(o.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-700 leading-relaxed">
            Confirming will mark all {orders.length} orders as settled. Make sure the actual bank transfer has been sent first.
          </p>
        </div>

        <ModalActions
          onCancel={onClose}
          onConfirm={handleSettle}
          confirmLabel={loading ? "Processing…" : `Confirm £${restaurant.pendingBalance.toFixed(2)}`}
          confirmColor="var(--dash-accent)"
          loading={loading}
          disabled={fetching || orders.length === 0}
        />
      </div>
    </Modal>
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
                    <span className={`text-sm font-bold ${r.pendingBalance > 0 ? "text-amber-600" : "text-green-600"}`}>
                      £{r.pendingBalance.toFixed(2)}
                    </span>
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
    </div>
  );
}
