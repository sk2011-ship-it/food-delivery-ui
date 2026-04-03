"use client";

import { useState, useEffect } from "react";
import {
  Search, Plus, MoreVertical, Pencil, Trash2, X,
  ChevronDown, ChefHat, CheckCircle2,
} from "lucide-react";
import { restaurantApi, menuApi, type AdminRestaurantItem, type AdminMenuItemResponse } from "@/lib/api";
import { LOCATIONS, locationTheme } from "@/lib/locations";
import { toast } from "sonner";

/* ── Predefined categories ── */
const MENU_CATEGORIES = [
  "Starters",
  "Mains",
  "Burgers",
  "Pizza",
  "Pasta",
  "Chicken",
  "Fish & Chips",
  "Kebabs & Wraps",
  "Sandwiches",
  "Salads",
  "Sides",
  "Desserts",
  "Ice Cream",
  "Cakes & Traybakes",
  "Hot Drinks",
  "Cold Drinks",
  "Milkshakes",
  "Kids Menu",
  "Meal Deals",
  "Specials",
  "Alcohol",
] as const;

/* ── Types ── */
type MenuItemStatus = "available" | "unavailable";

interface Restaurant {
  id:       string;
  name:     string;
  location: string;
}

interface MenuItem {
  id:                 string;
  restaurantId:       string;
  restaurantName:     string;
  restaurantLocation: string;
  name:               string;
  description:        string;
  category:           string;
  price:              number;
  status:             MenuItemStatus;
  imageUrl:           string;
}

interface MenuItemForm {
  restaurantId: string;
  name:         string;
  description:  string;
  category:     string;
  price:        string;
  status:       MenuItemStatus;
  imageUrl:     string;
}

const EMPTY_FORM: MenuItemForm = {
  restaurantId: "", name: "", description: "", category: "",
  price: "", status: "available", imageUrl: "",
};

const STATUS_META: Record<MenuItemStatus, { label: string; color: string; bg: string }> = {
  available:   { label: "Available",   color: "#16a34a", bg: "#f0fdf4" },
  unavailable: { label: "Unavailable", color: "#6b7280", bg: "#f3f4f6" },
};

/* ── Status badge ── */
function StatusBadge({ status }: { status: MenuItemStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

/* ── Modal wrapper ── */
function Modal({ title, onClose, children, icon }: {
  title: string; onClose: () => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--dash-card-border)" }} />
        </div>
        <div className="flex items-center justify-between px-6 pt-3 sm:pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls  = "w-full h-10 px-3 text-sm rounded-xl border outline-none transition-colors";
const inputStyle = {
  background:  "var(--dash-bg)",
  borderColor: "var(--dash-card-border)",
  color:       "var(--dash-text-primary)",
};

/* ── Dish form ── */
function DishForm({ form, restaurants, onChange }: {
  form:        MenuItemForm;
  restaurants: Restaurant[];
  onChange:    (patch: Partial<MenuItemForm>) => void;
}) {
  /* Local location filter — narrows the restaurant dropdown */
  const [formLocation, setFormLocation] = useState(() => {
    if (!form.restaurantId) return "";
    return restaurants.find((r) => r.id === form.restaurantId)?.location ?? "";
  });

  /* Track whether a custom category name is being entered */
  const isPreset = MENU_CATEGORIES.includes(form.category as typeof MENU_CATEGORIES[number]);
  const [isCustomCategory, setIsCustomCategory] = useState(!isPreset && form.category !== "");

  const visibleRestaurants = formLocation
    ? restaurants.filter((r) => r.location === formLocation)
    : restaurants;

  /* Restaurant search state */
  const [restSearch,   setRestSearch]   = useState("");
  const [restDropOpen, setRestDropOpen] = useState(false);

  const selectedRestaurant = restaurants.find((r) => r.id === form.restaurantId) ?? null;

  const filteredRestaurants = visibleRestaurants.filter((r) =>
    r.name.toLowerCase().includes(restSearch.toLowerCase())
  );

  const handleSelectRestaurant = (r: Restaurant) => {
    onChange({ restaurantId: r.id });
    setRestSearch("");
    setRestDropOpen(false);
  };

  const handleClearRestaurant = () => {
    onChange({ restaurantId: "" });
    setRestSearch("");
    setRestDropOpen(false);
  };

  /* If location changes and selected restaurant no longer in list, clear it */
  const handleLocationChange = (loc: string) => {
    setFormLocation(loc);
    const stillValid = restaurants.some((r) => r.id === form.restaurantId && (loc === "" || r.location === loc));
    if (!stillValid) onChange({ restaurantId: "" });
  };

  return (
    <>
      {/* Location → Restaurant cascade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Location *">
          <div className="relative">
            <select
              value={formLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className={inputCls + " appearance-none pr-8"}
              style={inputStyle}
            >
              <option value="">— Select location —</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
          </div>
        </Field>
        <Field label="Restaurant *">
          {/* Show selected chip when a restaurant is picked */}
          {selectedRestaurant ? (
            <div
              className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl border"
              style={{ background: "var(--dash-bg)", borderColor: "var(--dash-accent)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--dash-accent)" }} />
                <span className="text-sm font-medium truncate" style={{ color: "var(--dash-text-primary)" }}>
                  {selectedRestaurant.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearRestaurant}
                className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" style={{ color: "var(--dash-text-secondary)" }} />
              </button>
            </div>
          ) : (
            /* Search input + dropdown */
            <div className="relative">
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-xl border"
                style={{
                  background:  formLocation ? "var(--dash-bg)" : "var(--dash-bg)",
                  borderColor: restDropOpen ? "var(--dash-accent)" : "var(--dash-card-border)",
                  opacity:     formLocation ? 1 : 0.5,
                  pointerEvents: formLocation ? "auto" : "none",
                }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
                <input
                  type="text"
                  placeholder={formLocation ? "Search restaurant…" : "Select a location first"}
                  value={restSearch}
                  onChange={(e) => { setRestSearch(e.target.value); setRestDropOpen(true); }}
                  onFocus={() => setRestDropOpen(true)}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: "var(--dash-text-primary)" }}
                />
                {restSearch && (
                  <button type="button" onClick={() => setRestSearch("")}>
                    <X className="w-3 h-3" style={{ color: "var(--dash-text-secondary)" }} />
                  </button>
                )}
              </div>

              {/* Dropdown list */}
              {restDropOpen && formLocation && (
                <>
                  {/* Backdrop to close */}
                  <div className="fixed inset-0 z-10" onClick={() => setRestDropOpen(false)} />
                  <div
                    className="absolute left-0 right-0 top-11 z-20 rounded-xl border shadow-xl overflow-hidden"
                    style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
                  >
                    {filteredRestaurants.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--dash-text-secondary)" }}>
                        {restSearch ? `No results for "${restSearch}"` : "No restaurants in this location"}
                      </p>
                    ) : (
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {filteredRestaurants.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectRestaurant(r)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-black/5 transition-colors flex items-center gap-2"
                              style={{ color: "var(--dash-text-primary)" }}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: "var(--dash-accent)" }}
                              >
                                {r.name[0].toUpperCase()}
                              </div>
                              <span className="truncate">{r.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </Field>
      </div>

      {/* Dish name */}
      <Field label="Dish Name *">
        <input
          type="text"
          placeholder="e.g. Classic Smash Burger"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={inputCls}
          style={inputStyle}
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          rows={2}
          placeholder="Brief description of the dish…"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors resize-none"
          style={inputStyle}
        />
      </Field>

      {/* Category + Status */}
      <div className="space-y-3">
        <Field label="Category *">
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-bg)" }}
          >
            <div className="flex flex-wrap gap-1.5">
              {MENU_CATEGORIES.map((c) => {
                const active = !isCustomCategory && form.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setIsCustomCategory(false); onChange({ category: c }); }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all border"
                    style={active ? {
                      background:   "var(--dash-accent)",
                      color:        "#fff",
                      borderColor:  "var(--dash-accent)",
                    } : {
                      background:   "var(--dash-card)",
                      color:        "var(--dash-text-secondary)",
                      borderColor:  "var(--dash-card-border)",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
              {/* Custom pill */}
              <button
                type="button"
                onClick={() => { setIsCustomCategory(true); onChange({ category: "" }); }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all border"
                style={isCustomCategory ? {
                  background:  "var(--dash-accent)",
                  color:       "#fff",
                  borderColor: "var(--dash-accent)",
                } : {
                  background:   "var(--dash-card)",
                  color:        "var(--dash-text-secondary)",
                  borderColor:  "var(--dash-card-border)",
                  borderStyle:  "dashed",
                }}
              >
                + Custom
              </button>
            </div>

            {/* Custom text input */}
            {isCustomCategory && (
              <input
                autoFocus
                type="text"
                placeholder="Type your category name…"
                value={form.category}
                onChange={(e) => onChange({ category: e.target.value })}
                className="w-full mt-2.5 h-9 px-3 text-sm rounded-lg border outline-none"
                style={{ background: "var(--dash-card)", borderColor: "var(--dash-accent)", color: "var(--dash-text-primary)" }}
              />
            )}
          </div>
          {form.category && (
            <p className="text-xs mt-1" style={{ color: "var(--dash-text-secondary)" }}>
              Selected: <span className="font-semibold" style={{ color: "var(--dash-accent)" }}>{form.category}</span>
            </p>
          )}
        </Field>
      </div>

      {/* Price + Availability row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Price (£) *">
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none"
              style={{ color: "var(--dash-text-secondary)" }}
            >
              £
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => onChange({ price: e.target.value })}
              className={inputCls + " pl-7"}
              style={inputStyle}
            />
          </div>
        </Field>

        <Field label="Availability">
          <div className="relative">
            <select
              value={form.status}
              onChange={(e) => onChange({ status: e.target.value as MenuItemStatus })}
              className={inputCls + " appearance-none pr-8"}
              style={inputStyle}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
          </div>
        </Field>
      </div>

      {/* Dish Image — mandatory */}
      <Field label="Dish Image URL *">
        <input
          type="text"
          placeholder="https://example.com/image.jpg"
          value={form.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          className={inputCls}
          style={inputStyle}
        />
        <p className="text-xs mt-1" style={{ color: "var(--dash-text-secondary)" }}>
          Paste a public image link (e.g. from Unsplash, Imgur, etc.)
        </p>
        {form.imageUrl && (
          <div className="mt-2 rounded-xl overflow-hidden h-28 w-28 shrink-0" style={{ border: "1px solid var(--dash-card-border)" }}>
            <img
              src={form.imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </Field>
    </>
  );
}

/* ── Modal actions ── */
function ModalActions({ onCancel, onConfirm, confirmLabel, confirmColor, saving }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string;
  confirmColor?: string; saving?: boolean;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
        style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={saving}
        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: confirmColor ?? "var(--dash-accent)" }}
      >
        {saving ? "Please wait…" : confirmLabel}
      </button>
    </div>
  );
}

/* ── Action menu ── */
function ActionMenu({ open, onToggle, onEdit, onDelete }: {
  open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
      >
        <MoreVertical className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-36 rounded-xl shadow-lg border py-1 overflow-hidden"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-black/5 transition-colors" style={{ color: "var(--dash-text-primary)" }}>
            <Pencil className="w-3 h-3 shrink-0" /> Edit
          </button>
          <div className="border-t" style={{ borderColor: "var(--dash-card-border)" }} />
          <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3 h-3 shrink-0" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export default function AdminMenu() {
  const [restaurants,   setRestaurants]   = useState<Restaurant[]>([]);
  const [loadingRests,  setLoadingRests]  = useState(true);
  const [items,         setItems]         = useState<MenuItem[]>([]);
  const [loadingItems,  setLoadingItems]  = useState(true);

  const [search,           setSearch]           = useState("");
  const [locationFilter,   setLocationFilter]   = useState("all");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [statusFilter,     setStatusFilter]     = useState("all");
  const [menuId,           setMenuId]           = useState<string | null>(null);
  const [addOpen,          setAddOpen]          = useState(false);
  const [editTarget,       setEditTarget]       = useState<MenuItem | null>(null);
  const [deleteTarget,     setDeleteTarget]     = useState<MenuItem | null>(null);
  const [form,             setForm]             = useState<MenuItemForm>(EMPTY_FORM);
  const [saving,           setSaving]           = useState(false);

  const patchForm = (patch: Partial<MenuItemForm>) => setForm((f) => ({ ...f, ...patch }));

  /* ── Fetch active restaurants from DB ── */
  useEffect(() => {
    setLoadingRests(true);
    restaurantApi.list({ status: "active", limit: 200 }).then((res) => {
      if (res.success && res.data) {
        setRestaurants(
          res.data.restaurants.map((r: AdminRestaurantItem) => ({
            id:       r.id,
            name:     r.name,
            location: r.location ?? "",
          }))
        );
      } else {
        toast.error("Failed to load restaurants.");
      }
      setLoadingRests(false);
    });
  }, []);

  /* ── Fetch menu items from DB ── */
  useEffect(() => {
    setLoadingItems(true);
    menuApi.list({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        setItems(
          res.data.items.map((item: AdminMenuItemResponse) => ({
            id:                 item.id,
            restaurantId:       item.restaurantId,
            restaurantName:     item.restaurantName ?? "",
            restaurantLocation: item.restaurantLocation ?? "",
            name:               item.name,
            description:        item.description ?? "",
            category:           item.category,
            price:              item.price,
            status:             item.status,
            imageUrl:           item.imageUrl,
          }))
        );
      } else {
        toast.error("Failed to load menu items.");
      }
      setLoadingItems(false);
    });
  }, []);

  /* ── Reset restaurant filter when location changes ── */
  const handleLocationFilterChange = (loc: string) => {
    setLocationFilter(loc);
    setRestaurantFilter("all");
  };

  /* ── Restaurants visible in filter dropdown (scoped by location filter) ── */
  const filterableRestaurants = locationFilter === "all"
    ? restaurants
    : restaurants.filter((r) => r.location === locationFilter);

  /* ── Filtered list ── */
  const filtered = items.filter((item) => {
    if (locationFilter   !== "all" && item.restaurantLocation !== locationFilter)   return false;
    if (restaurantFilter !== "all" && item.restaurantId       !== restaurantFilter) return false;
    if (statusFilter     !== "all" && item.status             !== statusFilter)     return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !item.name.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q) &&
        !item.restaurantName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  /* ── Validate form ── */
  const validateForm = (): string | null => {
    if (!form.restaurantId) return "Please select a restaurant.";
    if (!form.name.trim())  return "Dish name is required.";
    if (!form.price)        return "Price is required.";
    if (!form.imageUrl.trim()) return "Dish image URL is required.";
    return null;
  };

  /* ── Add ── */
  const handleAdd = async () => {
    const err = validateForm();
    if (err) { toast.error(err); return; }
    setSaving(true);
    const res = await menuApi.create({
      restaurantId: form.restaurantId,
      name:         form.name.trim(),
      description:  form.description.trim() || undefined,
      category:     form.category.trim(),
      price:        parseFloat(form.price),
      status:       form.status,
      imageUrl:     form.imageUrl.trim(),
    });
    setSaving(false);
    if (!res.success || !res.data) { toast.error(res.error ?? "Failed to add dish."); return; }
    const d = res.data;
    setItems((prev) => [{
      id:                 d.id,
      restaurantId:       d.restaurantId,
      restaurantName:     d.restaurantName ?? "",
      restaurantLocation: d.restaurantLocation ?? "",
      name:               d.name,
      description:        d.description ?? "",
      category:           d.category,
      price:              d.price,
      status:             d.status,
      imageUrl:           d.imageUrl,
    }, ...prev]);
    setAddOpen(false);
    setForm(EMPTY_FORM);
    toast.success("Dish added.");
  };

  /* ── Edit ── */
  const handleEdit = async () => {
    if (!editTarget) return;
    const err = validateForm();
    if (err) { toast.error(err); return; }
    setSaving(true);
    const res = await menuApi.update(editTarget.id, {
      restaurantId: form.restaurantId,
      name:         form.name.trim(),
      description:  form.description.trim() || undefined,
      category:     form.category.trim(),
      price:        parseFloat(form.price),
      status:       form.status,
      imageUrl:     form.imageUrl.trim(),
    });
    setSaving(false);
    if (!res.success || !res.data) { toast.error(res.error ?? "Failed to update dish."); return; }
    const d = res.data;
    setItems((prev) =>
      prev.map((item) =>
        item.id === editTarget.id
          ? {
              id:                 d.id,
              restaurantId:       d.restaurantId,
              restaurantName:     d.restaurantName ?? "",
              restaurantLocation: d.restaurantLocation ?? "",
              name:               d.name,
              description:        d.description ?? "",
              category:           d.category,
              price:              d.price,
              status:             d.status,
              imageUrl:           d.imageUrl,
            }
          : item
      )
    );
    setEditTarget(null);
    setForm(EMPTY_FORM);
    toast.success("Dish updated.");
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const res = await menuApi.delete(deleteTarget.id);
    setSaving(false);
    if (!res.success) { toast.error(res.error ?? "Failed to delete dish."); return; }
    setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Dish deleted.");
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>Menu Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            {loadingRests || loadingItems ? "Loading…" : "Manage dishes across all restaurants"}
          </p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setForm(EMPTY_FORM); }}
          disabled={loadingRests || loadingItems || restaurants.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--dash-accent)" }}
        >
          <Plus className="w-4 h-4" /> Add Dish
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
          <input
            type="text"
            placeholder="Search dishes, categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border outline-none"
            style={{ background: "var(--dash-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
          />
        </div>

        {/* Location filter */}
        <div className="relative">
          <select
            value={locationFilter}
            onChange={(e) => handleLocationFilterChange(e.target.value)}
            className="appearance-none text-sm font-medium h-9 pl-3 pr-7 rounded-xl border outline-none cursor-pointer"
            style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
          >
            <option value="all">All Locations</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
        </div>

        {/* Restaurant filter */}
        <div className="relative">
          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="appearance-none text-sm font-medium h-9 pl-3 pr-7 rounded-xl border outline-none cursor-pointer"
            style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
          >
            <option value="all">All Restaurants</option>
            {filterableRestaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none text-sm font-medium h-9 pl-3 pr-7 rounded-xl border outline-none cursor-pointer"
            style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {(loadingRests || loadingItems) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden animate-pulse"
              style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
            >
              <div className="h-40 w-full" style={{ background: "var(--dash-bg)" }} />
              <div className="p-4 space-y-2">
                <div className="h-3.5 w-3/4 rounded-lg" style={{ background: "var(--dash-bg)" }} />
                <div className="h-3 w-1/2 rounded-lg" style={{ background: "var(--dash-bg)" }} />
                <div className="h-3 w-1/3 rounded-lg mt-3" style={{ background: "var(--dash-bg)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loadingRests && !loadingItems && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
          style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--dash-bg)" }}>
            <ChefHat className="w-7 h-7" style={{ color: "var(--dash-text-secondary)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
            {search || locationFilter !== "all" || restaurantFilter !== "all" || statusFilter !== "all"
              ? "No dishes match your filters."
              : restaurants.length === 0
              ? "No active restaurants found. Add a restaurant first."
              : "No dishes yet. Click \"Add Dish\" to get started."}
          </p>
        </div>
      )}

      {/* ── Desktop table (md+) ── */}
      {!loadingRests && !loadingItems && filtered.length > 0 && (
        <>
          <div className="hidden md:block rounded-2xl" style={{ border: "1px solid var(--dash-card-border)" }}>
            {/* Header */}
            <div
              className="grid items-center px-6 py-3 text-xs font-semibold uppercase tracking-wide rounded-t-2xl"
              style={{
                gridTemplateColumns: "4.5rem 1fr 1fr 8rem 9rem 6rem 7rem 2.5rem",
                columnGap: "1.25rem",
                background: "var(--dash-bg)",
                borderBottom: "1px solid var(--dash-card-border)",
                color: "var(--dash-text-secondary)",
              }}
            >
              <span>Image</span>
              <span>Dish</span>
              <span>Restaurant</span>
              <span>Location</span>
              <span>Category</span>
              <span>Price</span>
              <span>Status</span>
              <span />
            </div>

            {/* Rows */}
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className="grid items-center px-6 py-4 transition-colors hover:bg-black/[0.015]"
                style={{
                  gridTemplateColumns: "4.5rem 1fr 1fr 8rem 9rem 6rem 7rem 2.5rem",
                  columnGap: "1.25rem",
                  background: "var(--dash-card)",
                  borderTop: i === 0 ? "none" : "1px solid var(--dash-card-border)",
                  borderBottomLeftRadius: i === filtered.length - 1 ? "1rem" : "0",
                  borderBottomRightRadius: i === filtered.length - 1 ? "1rem" : "0",
                }}
              >
                {/* Image */}
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
                  style={{ border: "1px solid var(--dash-card-border)" }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      el.parentElement!.style.background = "var(--dash-bg)";
                    }}
                  />
                </div>

                {/* Dish name + description */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{item.name}</p>
                  {item.description && (
                    <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>{item.description}</p>
                  )}
                </div>

                {/* Restaurant */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--dash-text-primary)" }}>{item.restaurantName}</p>
                </div>

                {/* Location */}
                <div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ color: locationTheme(item.restaurantLocation).color, background: locationTheme(item.restaurantLocation).bg }}
                  >
                    {item.restaurantLocation || "—"}
                  </span>
                </div>

                {/* Category */}
                <div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "var(--dash-bg)", color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }}
                  >
                    {item.category || "—"}
                  </span>
                </div>

                {/* Price */}
                <div className="min-w-0">
                  <p className="text-base font-bold tabular-nums" style={{ color: "var(--dash-text-primary)" }}>
                    £{item.price.toFixed(2)}
                  </p>
                </div>

                {/* Status */}
                <div className="min-w-0 flex items-center">
                  <StatusBadge status={item.status} />
                </div>

                {/* Actions */}
                <ActionMenu
                  open={menuId === item.id}
                  onToggle={() => setMenuId(menuId === item.id ? null : item.id)}
                  onEdit={() => {
                    setEditTarget(item);
                    setForm({
                      restaurantId: item.restaurantId,
                      name:         item.name,
                      description:  item.description,
                      category:     item.category,
                      price:        String(item.price),
                      status:       item.status,
                      imageUrl:     item.imageUrl,
                    });
                    setMenuId(null);
                  }}
                  onDelete={() => { setDeleteTarget(item); setMenuId(null); }}
                />
              </div>
            ))}
          </div>

          {/* ── Mobile cards (< md) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {filtered.map((item) => {
              const theme = locationTheme(item.restaurantLocation);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
                >
                  {/* Card image */}
                  <div className="relative h-40 w-full shrink-0" style={{ background: "var(--dash-bg)" }}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    {/* Action button overlay */}
                    <div className="absolute top-1 right-1">
                      <ActionMenu
                        open={menuId === item.id}
                        onToggle={() => setMenuId(menuId === item.id ? null : item.id)}
                        onEdit={() => {
                          setEditTarget(item);
                          setForm({
                            restaurantId: item.restaurantId,
                            name:         item.name,
                            description:  item.description,
                            category:     item.category,
                            price:        String(item.price),
                            status:       item.status,
                            imageUrl:     item.imageUrl,
                          });
                          setMenuId(null);
                        }}
                        onDelete={() => { setDeleteTarget(item); setMenuId(null); }}
                      />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div>
                      <p className="text-sm font-bold leading-snug" style={{ color: "var(--dash-text-primary)" }}>{item.name}</p>
                      {item.description && (
                        <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>{item.restaurantName}</p>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: theme.color, background: theme.bg }}
                      >
                        {item.restaurantLocation || "—"}
                      </span>
                    </div>

                    <div className="mt-auto pt-3 space-y-3" style={{ borderTop: "1px solid var(--dash-card-border)" }}>
                      <span
                        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "var(--dash-bg)", color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }}
                      >
                        {item.category || "—"}
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--dash-text-secondary)" }}>
                            Price
                          </p>
                          <p className="text-lg font-bold tabular-nums" style={{ color: "var(--dash-text-primary)" }}>
                            £{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--dash-text-secondary)" }}>
                            Status
                          </p>
                          <div className="flex">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Result count */}
      {!loadingRests && !loadingItems && items.length > 0 && (
        <p className="text-xs text-center pb-1" style={{ color: "var(--dash-text-secondary)" }}>
          Showing {filtered.length} of {items.length} dishes
        </p>
      )}

      {/* ── Add modal ── */}
      {addOpen && (
        <Modal
          title="Add New Dish"
          onClose={() => setAddOpen(false)}
          icon={<div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--dash-accent)" }}><ChefHat className="w-4 h-4 text-white" /></div>}
        >
          <DishForm form={form} restaurants={restaurants} onChange={patchForm} />
          <ModalActions
            onCancel={() => setAddOpen(false)}
            onConfirm={handleAdd}
            confirmLabel="Add Dish"
            saving={saving}
          />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <Modal
          title="Edit Dish"
          onClose={() => { setEditTarget(null); setForm(EMPTY_FORM); }}
          icon={<div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--dash-accent)" }}><ChefHat className="w-4 h-4 text-white" /></div>}
        >
          <DishForm form={form} restaurants={restaurants} onChange={patchForm} />
          <ModalActions
            onCancel={() => { setEditTarget(null); setForm(EMPTY_FORM); }}
            onConfirm={handleEdit}
            confirmLabel="Save Changes"
            saving={saving}
          />
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <Modal
          title="Delete Dish"
          onClose={() => setDeleteTarget(null)}
          icon={<div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-500" /></div>}
        >
          <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
            Are you sure you want to delete{" "}
            <span className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>{deleteTarget.name}</span>?
            This action cannot be undone.
          </p>
          <ModalActions
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            confirmLabel="Delete"
            confirmColor="#ef4444"
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}
