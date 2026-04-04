"use client";

import { useState, useEffect } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, Store, Loader2
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";

type RestaurantStatus = "active" | "inactive" | "suspended";
type SortField        = "name" | "createdAt";
type SortOrder        = "asc" | "desc";

interface Restaurant {
  id:           string;
  name:         string;
  contactEmail: string;
  contactPhone: string;
  site:         string;
  ownerName:    string;
  status:       RestaurantStatus;
  createdAt:    string;
}

const STATUS_META: Record<RestaurantStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "#f0fdf4" },
  inactive:  { label: "Inactive",  color: "#6b7280", bg: "#f3f4f6" },
  suspended: { label: "Suspended", color: "#ef4444", bg: "#fef2f2" },
};

const PAGE_SIZE = 8;

export default function OwnerRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort,   setSort]   = useState<SortField>("name");
  const [order,  setOrder]  = useState<SortOrder>("asc");
  const [page,   setPage]   = useState(1);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/owner/restaurants");
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to fetch");

        // Format dates if needed
        const items = (json.data?.items || []).map((r: any) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : "N/A"
        }));

        setRestaurants(items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      r.name.toLowerCase().includes(q) || 
      r.contactEmail.toLowerCase().includes(q) || 
      (r.site?.toLowerCase() || "").includes(q);
    const matchStatus = status === "all" || r.status === status;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const cmp = sort === "name"
      ? a.name.localeCompare(b.name)
      : a.createdAt.localeCompare(b.createdAt);
    return order === "asc" ? cmp : -cmp;
  });

  const total      = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced     = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(field); setOrder("asc"); }
    setPage(1);
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sort !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return order === "asc"
      ? <ChevronUp   className="w-3.5 h-3.5 text-gray-700" />
      : <ChevronDown className="w-3.5 h-3.5 text-gray-700" />;
  }

  return (
    <div>
      <PageHeader title="Restaurants" subtitle="View all restaurants across all sites" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or site…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Restaurant <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">Owner</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">Site</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Added <SortIcon field="createdAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p>Loading restaurants...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-24 text-center text-red-500">{error}</td>
                </tr>
              ) : sliced.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-24 text-center text-gray-400 text-sm">No restaurants found.</td>
                </tr>
              ) : sliced.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.inactive;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400 truncate">{r.contactEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{r.ownerName || "N/A"}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{r.site || "N/A"}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: meta.color, background: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{r.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 mt-auto">
          <p className="text-xs text-gray-500">
            {total === 0 ? "No results" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
