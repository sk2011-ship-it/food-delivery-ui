"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, CheckCircle, Ban, Clock, Star,
  ChevronLeft, ChevronRight, ChevronDown,
  MessageSquare, X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string; phone?: string };
  restaurant?: { name?: string };
  order?: { id?: string };
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Approved", color: "#16a34a", bg: "#f0fdf4" },
  inactive: { label: "Pending",  color: "#d97706", bg: "#fffbeb" },
  ban:      { label: "Banned",   color: "#dc2626", bg: "#fef2f2" },
};

const PAGE_SIZE = 15;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3 h-3", rating >= s ? "fill-amber-400 text-amber-400" : "text-gray-200")}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,        setPage]        = useState(1);
  const [updatingId,  setUpdatingId]  = useState<string | null>(null);
  const [drawer,      setDrawer]      = useState<Review | null>(null);

  const { session } = useAuthStore();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/reviews", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (res.ok) setReviews(data.data.reviews || []);
    } catch {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (session) fetchReviews(); }, [session]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
        if (drawer?.id === id) setDrawer((d) => d ? { ...d, status: newStatus } : d);
        toast.success(newStatus === "active" ? "Review approved" : newStatus === "ban" ? "Review banned" : "Review hidden");
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (r.comment || "").toLowerCase().includes(q) ||
        (r.user?.name || "").toLowerCase().includes(q) ||
        (r.restaurant?.name || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reviews, search, statusFilter]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Moderation" subtitle="Review and manage community feedback" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by comment, user or restaurant…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none bg-white focus:border-gray-400"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer"
          >
            <option value="all">All Reviews</option>
            <option value="inactive">Pending</option>
            <option value="active">Approved</option>
            <option value="ban">Banned</option>
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
                <th className="px-5 py-3 text-left font-semibold text-gray-500 w-24">Rating</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Comment</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">User</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">Restaurant</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">Date</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-400">Loading reviews…</td>
                </tr>
              ) : sliced.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No matching reviews</p>
                  </td>
                </tr>
              ) : sliced.map((r) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.inactive;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setDrawer(r)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <StarRating rating={r.rating} />
                    </td>
                    <td className="px-5 py-3.5 max-w-[240px]">
                      <p className="text-sm text-gray-700 truncate">
                        {r.comment || <span className="text-gray-300 italic">No comment</span>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-gray-900 font-medium truncate max-w-[120px]">
                        {r.user?.name || "Anonymous"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-sm text-gray-500 truncate max-w-[120px]">
                        {r.restaurant?.name || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.status !== "active" && (
                          <button
                            onClick={() => handleStatus(r.id, "active")}
                            disabled={!!updatingId}
                            title="Approve"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-40"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status === "active" && (
                          <button
                            onClick={() => handleStatus(r.id, "inactive")}
                            disabled={!!updatingId}
                            title="Hide"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-40"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status !== "ban" && (
                          <button
                            onClick={() => handleStatus(r.id, "ban")}
                            disabled={!!updatingId}
                            title="Ban"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {total === 0
              ? "No results"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} reviews`}
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
      <ReviewDrawer
        review={drawer}
        onClose={() => setDrawer(null)}
        onStatusChange={handleStatus}
        updatingId={updatingId}
      />
    </div>
  );
}

/* ── Review detail drawer ── */
function ReviewDrawer({
  review,
  onClose,
  onStatusChange,
  updatingId,
}: {
  review: Review | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  updatingId: string | null;
}) {
  return (
    <AnimatePresence>
      {review && (
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
                <p className="text-xs text-gray-400 font-medium">Review details</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-bold text-gray-900">{review.rating}/5</span>
                </div>
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
              {/* Comment */}
              <div className="px-6 py-5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comment</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.comment || <span className="text-gray-300 italic">No comment provided</span>}
                </p>
              </div>

              {/* User */}
              <div className="px-6 py-5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Name</p>
                    <p className="text-sm font-medium text-gray-900">{review.user?.name || "Anonymous"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Email</p>
                    <p className="text-sm text-gray-600">{review.user?.email || "Deleted account"}</p>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div className="px-6 py-5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Info</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Restaurant</p>
                    <p className="text-sm font-medium text-gray-900">{review.restaurant?.name || "—"}</p>
                  </div>
                  {review.order?.id && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Order</p>
                      <p className="text-sm font-mono text-gray-600">#{review.order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Submitted</p>
                    <p className="text-sm text-gray-600">{format(new Date(review.createdAt), "MMM d, yyyy · HH:mm")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
              {(() => {
                const meta = STATUS_META[review.status] ?? STATUS_META.inactive;
                return (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 font-medium">Current status</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })()}
              {review.status !== "active" && (
                <button
                  onClick={() => onStatusChange(review.id, "active")}
                  disabled={!!updatingId}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              )}
              {review.status === "active" && (
                <button
                  onClick={() => onStatusChange(review.id, "inactive")}
                  disabled={!!updatingId}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" /> Hide Review
                </button>
              )}
              {review.status !== "ban" && (
                <button
                  onClick={() => onStatusChange(review.id, "ban")}
                  disabled={!!updatingId}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" /> Ban Review
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
