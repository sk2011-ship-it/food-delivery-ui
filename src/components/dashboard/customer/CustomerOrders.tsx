"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useSite } from "@/context/SiteContext";

const allOrders = [
  {
    id: "#1038", restaurant: "Pizza Palace", image: "🍕",
    items: "Margherita · Garlic Bread", total: "£18.50",
    status: "Delivered", date: "Today, 12:30",
  },
  {
    id: "#1021", restaurant: "The Anchor Bar", image: "🍔",
    items: "Burger · Chips · Coke", total: "£26.00",
    status: "Delivered", date: "Yesterday",
  },
  {
    id: "#1009", restaurant: "Sushi Station", image: "🍣",
    items: "California Roll x2", total: "£22.00",
    status: "Delivered", date: "3 days ago",
  },
  {
    id: "#0997", restaurant: "Curry House", image: "🍛",
    items: "Chicken Tikka · Naan", total: "£19.90",
    status: "Cancelled", date: "5 days ago",
  },
  {
    id: "#0984", restaurant: "Noodle Box", image: "🍜",
    items: "Pad Thai · Spring Rolls", total: "£15.50",
    status: "Delivered", date: "1 week ago",
  },
  {
    id: "#0971", restaurant: "Taco Town", image: "🌮",
    items: "Beef Tacos x3 · Nachos", total: "£21.00",
    status: "Delivered", date: "2 weeks ago",
  },
];

const statusMeta: Record<string, { color: string; bg: string }> = {
  Delivered: { color: "#22c55e", bg: "#f0fdf4" },
  Cancelled: { color: "#ef4444", bg: "#fef2f2" },
  Active:    { color: "#F97316", bg: "#fff3e8" },
};

const TABS = ["All", "Active", "Delivered", "Cancelled"] as const;
type Tab = typeof TABS[number];

export default function CustomerOrders({ user: _user }: { user: SessionUser }) {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");

  const filtered = allOrders.filter((o) => {
    const matchTab = tab === "All" || o.status === tab;
    const matchSearch =
      !search ||
      o.restaurant.toLowerCase().includes(search.toLowerCase()) ||
      o.items.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
          My Orders
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
          {allOrders.length} orders placed in total
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
          <input
            type="text"
            placeholder="Search orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: "var(--dash-text-primary)" }}
          />
        </div>
        <button
          className="p-3 rounded-2xl border transition-all hover:shadow-sm"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <SlidersHorizontal className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
            style={
              tab === t
                ? { background: `linear-gradient(135deg, ${gradientFrom}, ${accent})`, color: "#fff" }
                : { background: "var(--dash-card)", color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-3xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
        >
          <span className="text-5xl">📋</span>
          <p className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>
            No orders found
          </p>
          <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
            Try changing your filter or search term
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const meta = statusMeta[order.status] ?? statusMeta.Delivered;
            return (
              <div
                key={order.id}
                className="rounded-3xl p-4 sm:p-5 transition-all hover:shadow-md cursor-pointer"
                style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
              >
                <div className="flex items-start gap-4">
                  {/* emoji */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "var(--dash-bg)" }}
                  >
                    {order.image}
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm" style={{ color: "var(--dash-text-primary)" }}>
                          {order.restaurant}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--dash-text-secondary)" }}>
                          {order.items}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: "var(--dash-text-primary)" }}>
                          {order.total}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
                          {order.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                        {order.date}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {order.status}
                        </span>
                        {order.status === "Delivered" && (
                          <button
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                            style={{ background: `${accent}18`, color: accent }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
