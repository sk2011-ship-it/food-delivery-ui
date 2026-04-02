"use client";

import { useState, useEffect } from "react";
import {
  Search, Plus, MoreVertical, Pencil, Trash2, X,
  ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, Mail, Phone,
} from "lucide-react";
import {
  restaurantApi,
  adminApi,
  type AdminRestaurantItem,
  type RestaurantStatus,
  type OpeningHours,
  type DayKey,
  type AdminUserItem,
} from "@/lib/api";
import { LOCATIONS, locationTheme } from "@/lib/locations";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import PhoneCountrySelect from "@/components/ui/PhoneCountrySelect";
import type { E164Number } from "libphonenumber-js";
import "react-phone-number-input/style.css";

/* ── Types ── */
type SortField = "name" | "createdAt";
type SortOrder = "asc" | "desc";

interface Filters {
  search:   string;
  status:   string;
  location: string;
  sort:     SortField;
  order:    SortOrder;
  page:     number;
  pageSize: number;
}

type DayHoursRow = { enabled: boolean; open: string; close: string };
type HoursForm   = Record<DayKey, DayHoursRow>;

interface RestaurantForm {
  name:          string;
  location:      string;
  logoUrl:       string;
  ownerId:       string;
  managerPhone:  string;
  contactEmail:  string;
  contactPhone:  string;
  businessRegNo: string;
  status:        RestaurantStatus;
  hours:         HoursForm;
}

/* ── Constants ── */
const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday",    short: "Mon" },
  { key: "tue", label: "Tuesday",   short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday",  short: "Thu" },
  { key: "fri", label: "Friday",    short: "Fri" },
  { key: "sat", label: "Saturday",  short: "Sat" },
  { key: "sun", label: "Sunday",    short: "Sun" },
];

const WEEKDAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];

const DEFAULT_HOURS: HoursForm = Object.fromEntries(
  DAYS.map(({ key }) => [key, { enabled: false, open: "09:00", close: "22:00" }])
) as HoursForm;

const EMPTY_FORM: RestaurantForm = {
  name: "", location: "", logoUrl: "", ownerId: "", managerPhone: "",
  contactEmail: "", contactPhone: "", businessRegNo: "", status: "active",
  hours: { ...DEFAULT_HOURS },
};

const STATUS_META: Record<RestaurantStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "#f0fdf4" },
  inactive:  { label: "Inactive",  color: "#6b7280", bg: "#f3f4f6" },
  suspended: { label: "Suspended", color: "#ef4444", bg: "#fef2f2" },
};

/* ── Helpers ── */
function hoursToApi(h: HoursForm): OpeningHours {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, h[key].enabled ? { open: h[key].open, close: h[key].close } : null])
  ) as OpeningHours;
}

function apiToHours(oh: OpeningHours | null | undefined): HoursForm {
  const f = structuredClone(DEFAULT_HOURS);
  if (!oh) return f;
  for (const { key } of DAYS) {
    const d = oh[key];
    f[key] = d ? { enabled: true, open: d.open, close: d.close } : { enabled: false, open: "09:00", close: "22:00" };
  }
  return f;
}

function restaurantToForm(r: AdminRestaurantItem): RestaurantForm {
  return {
    name:          r.name,
    location:      r.location      ?? "",
    logoUrl:       r.logoUrl       ?? "",
    ownerId:       r.ownerId,
    managerPhone:  r.managerPhone  ?? "",
    contactEmail:  r.contactEmail,
    contactPhone:  r.contactPhone,
    businessRegNo: r.businessRegNo ?? "",
    status:        r.status,
    hours:         apiToHours(r.openingHours),
  };
}

/* ── Logo avatar ── */
function LogoAvatar({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  if (logoUrl && !broken) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setBroken(true)}
        className="w-9 h-9 rounded-xl object-cover shrink-0"
        style={{ border: "1px solid var(--dash-card-border)" }}
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: "var(--dash-accent)" }}
    >
      {name[0]?.toUpperCase() ?? "R"}
    </div>
  );
}

/* ── Filter Select ── */
function FilterSelect({ value, onChange, options }: {
  value:    string;
  onChange: (v: string) => void;
  options:  { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-sm font-medium px-3 py-2.5 pr-7 rounded-xl border outline-none cursor-pointer"
        style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
    </div>
  );
}

/* ── Sort icon ── */
function SortIcon({ field, filters }: { field: SortField; filters: Filters }) {
  if (filters.sort !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
  return filters.order === "asc"
    ? <ChevronUp   className="w-3.5 h-3.5" style={{ color: "var(--dash-accent)" }} />
    : <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--dash-accent)" }} />;
}

/* ── Action menu ── */
function ActionMenu({ menuOpen, onToggle, onEdit, onDelete }: {
  menuOpen: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
      >
        <MoreVertical className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
      </button>
      {menuOpen && (
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

/* ── Pagination helpers ── */
function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PageBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={
        active
          ? { background: "var(--dash-accent)", color: "#fff" }
          : { background: "var(--dash-card)", color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }
      }
    >
      {children}
    </button>
  );
}

/* ── Modal wrapper ── */
function Modal({ title, onClose, children, icon }: {
  title: string; onClose: () => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Modal actions ── */
function ModalActions({ onCancel, onConfirm, confirmLabel, confirmColor, loading, disabled }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string;
  confirmColor?: string; loading?: boolean; disabled?: boolean;
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
        style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading || disabled}
        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: confirmColor ?? "var(--dash-accent)" }}
      >
        {loading ? "Please wait…" : confirmLabel}
      </button>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, children, style }: {
  label: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>{label}</label>
      <div className="flex items-center gap-2 h-11 px-3 rounded-xl border" style={style}>
        {children}
      </div>
    </div>
  );
}


/* ── Opening Hours Editor ── */
function HoursEditor({ hours, onChange }: {
  hours: HoursForm; onChange: (h: HoursForm) => void;
}) {
  const toggle = (key: DayKey) =>
    onChange({ ...hours, [key]: { ...hours[key], enabled: !hours[key].enabled } });

  const setTime = (key: DayKey, field: "open" | "close", val: string) =>
    onChange({ ...hours, [key]: { ...hours[key], [field]: val } });

  const applyQuick = (keys: DayKey[], open: string, close: string) => {
    const next = { ...hours };
    for (const k of keys) next[k] = { enabled: true, open, close };
    onChange(next);
  };

  const closeAll = () => {
    const next = { ...hours };
    for (const { key } of DAYS) next[key] = { ...next[key], enabled: false };
    onChange(next);
  };

  const timeStyle = {
    background:  "var(--dash-bg)",
    borderColor: "var(--dash-card-border)",
    color:       "var(--dash-text-primary)",
  };

  return (
    <div className="space-y-1.5">
      {/* Quick presets */}
      <div className="flex items-center gap-1.5 flex-wrap pb-1">
        <span className="text-xs font-medium" style={{ color: "var(--dash-text-secondary)" }}>Quick:</span>
        {[
          { label: "Weekdays",  action: () => applyQuick(WEEKDAYS, "09:00", "22:00") },
          { label: "Every day", action: () => applyQuick(DAYS.map(d => d.key), "09:00", "22:00") },
          { label: "Close all", action: closeAll },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors hover:bg-black/5"
            style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Day rows — grid keeps all 4 columns aligned across every row */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--dash-card-border)" }}
      >
        {DAYS.map(({ key, short }, i) => {
          const row = hours[key];
          return (
            <div
              key={key}
              className="grid items-center px-3 py-2.5 transition-colors"
              style={{
                gridTemplateColumns: "2.5rem 2.5rem 1fr 3rem",
                columnGap: "0.75rem",
                borderTop: i === 0 ? "none" : "1px solid var(--dash-card-border)",
                background: row.enabled ? "rgba(0,0,0,0.015)" : "transparent",
              }}
            >
              {/* Day name */}
              <span
                className="text-xs font-semibold"
                style={{ color: row.enabled ? "var(--dash-text-primary)" : "var(--dash-text-secondary)" }}
              >
                {short}
              </span>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggle(key)}
                className="relative w-9 h-5 rounded-full transition-colors overflow-hidden"
                style={{ background: row.enabled ? "var(--dash-accent)" : "var(--dash-card-border)" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: row.enabled ? "translateX(16px)" : "translateX(0px)" }}
                />
              </button>

              {/* Time range or Closed */}
              {row.enabled ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <input
                    type="time"
                    value={row.open}
                    onChange={(e) => setTime(key, "open", e.target.value)}
                    className="flex-1 min-w-0 text-xs font-medium px-2 py-1 rounded-lg border outline-none"
                    style={timeStyle}
                  />
                  <span className="text-xs shrink-0" style={{ color: "var(--dash-text-secondary)" }}>–</span>
                  <input
                    type="time"
                    value={row.close}
                    onChange={(e) => setTime(key, "close", e.target.value)}
                    className="flex-1 min-w-0 text-xs font-medium px-2 py-1 rounded-lg border outline-none"
                    style={timeStyle}
                  />
                </div>
              ) : (
                <span className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>Closed</span>
              )}

              {/* Status */}
              <span
                className="text-xs font-semibold text-right"
                style={{ color: row.enabled ? "var(--dash-accent)" : "var(--dash-card-border)" }}
              >
                {row.enabled ? "Open" : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Restaurant Form Fields ── */
function RestaurantFormFields({ form, owners, onChange }: {
  form:     RestaurantForm;
  owners:   AdminUserItem[];
  onChange: (patch: Partial<RestaurantForm>) => void;
}) {
  const border    = { borderColor: "var(--dash-card-border)" };
  const fieldBg   = { background: "var(--dash-bg)", color: "var(--dash-text-primary)", ...border };
  const input     = "flex-1 text-sm bg-transparent outline-none";
  const section   = "text-xs font-bold uppercase tracking-wider mb-3";
  const phoneWrap = "flex h-11 w-full rounded-xl border overflow-hidden";
  const phoneStyle = { borderColor: "var(--dash-card-border)", background: "var(--dash-bg)" };

  return (
    <>
      {/* Basic Info */}
      <div>
        <p className={section} style={{ color: "var(--dash-text-secondary)" }}>Basic Info</p>
        <div className="space-y-3">
          <Field label="Restaurant Name *" style={fieldBg}>
            <input type="text" placeholder="e.g. The Burger Place" value={form.name}
              onChange={(e) => onChange({ name: e.target.value })} className={input} style={{ color: "var(--dash-text-primary)" }} />
          </Field>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Location *</label>
            <div className="relative">
              <select
                value={form.location}
                onChange={(e) => onChange({ location: e.target.value })}
                className="w-full appearance-none h-11 px-3 pr-8 text-sm rounded-xl border outline-none"
                style={fieldBg}
              >
                <option value="">— Select location —</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
            </div>
          </div>

          <Field label="Logo URL" style={fieldBg}>
            <input type="url" placeholder="https://..." value={form.logoUrl}
              onChange={(e) => onChange({ logoUrl: e.target.value })} className={input} style={{ color: "var(--dash-text-primary)" }} />
          </Field>
          <Field label="Business Registration No" style={fieldBg}>
            <input type="text" placeholder="Optional" value={form.businessRegNo}
              onChange={(e) => onChange({ businessRegNo: e.target.value })} className={input} style={{ color: "var(--dash-text-primary)" }} />
          </Field>
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className={section} style={{ color: "var(--dash-text-secondary)" }}>Contact</p>
        <div className="space-y-3">
          <Field label="Contact Email *" style={fieldBg}>
            <Mail className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
            <input type="email" placeholder="hello@restaurant.com" value={form.contactEmail}
              onChange={(e) => onChange({ contactEmail: e.target.value })} className={input} style={{ color: "var(--dash-text-primary)" }} />
          </Field>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Contact Phone *</label>
            <div className={phoneWrap} style={phoneStyle}>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="GB"
                countrySelectComponent={PhoneCountrySelect}
                value={form.contactPhone as E164Number}
                onChange={(v) => onChange({ contactPhone: v ?? "" })}
                className="phone-input-wrapper w-full"
                numberInputProps={{ className: "phone-number-input", placeholder: "Restaurant phone", autoComplete: "tel" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Owner */}
      <div>
        <p className={section} style={{ color: "var(--dash-text-secondary)" }}>Owner</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Assign Owner *</label>
            <div className="relative">
              <select
                value={form.ownerId}
                onChange={(e) => onChange({ ownerId: e.target.value })}
                className="w-full appearance-none h-11 px-3 pr-8 text-sm rounded-xl border outline-none"
                style={fieldBg}
              >
                <option value="">— Select owner —</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} — {o.email}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
            </div>
            {owners.length === 0 && (
              <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                No owner accounts found. Create a user with the Owner role first.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
              Manager Phone <span className="font-normal">(optional)</span>
            </label>
            <div className={phoneWrap} style={phoneStyle}>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="GB"
                countrySelectComponent={PhoneCountrySelect}
                value={form.managerPhone as E164Number}
                onChange={(v) => onChange({ managerPhone: v ?? "" })}
                className="phone-input-wrapper w-full"
                numberInputProps={{ className: "phone-number-input", placeholder: "Manager mobile", autoComplete: "tel" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      <div>
        <p className={section} style={{ color: "var(--dash-text-secondary)" }}>Opening Hours</p>
        <HoursEditor hours={form.hours} onChange={(h) => onChange({ hours: h })} />
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export default function AdminRestaurants() {
  const [data,        setData]        = useState<{ restaurants: AdminRestaurantItem[]; total: number }>({ restaurants: [], total: 0 });
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetching,    setFetching]    = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filters,     setFilters]     = useState<Filters>({
    search: "", status: "all", location: "all", sort: "name", order: "asc", page: 1, pageSize: 10,
  });

  const [owners,       setOwners]       = useState<AdminUserItem[]>([]);
  const [menuId,       setMenuId]       = useState<string | null>(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<AdminRestaurantItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRestaurantItem | null>(null);
  const [form,         setForm]         = useState<RestaurantForm>(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  const toggleSort = (field: SortField) =>
    setFilters((f) => ({
      ...f,
      sort:  field,
      order: f.sort === field && f.order === "asc" ? "desc" : "asc",
      page:  1,
    }));

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput, page: 1 })), 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Fetch */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setFetching(true);
      const res = await restaurantApi.list({
        search:   filters.search   || undefined,
        status:   filters.status   !== "all" ? filters.status   : undefined,
        location: filters.location !== "all" ? filters.location : undefined,
        sort:     filters.sort,
        order:    filters.order,
        page:     filters.page,
        limit:    filters.pageSize,
      });
      if (cancelled) return;
      setFetching(false);
      setInitialLoad(false);
      if (res.success && res.data) {
        setData({ restaurants: res.data.restaurants, total: res.data.total });
      } else {
        toast.error(res.error ?? "Failed to load restaurants.");
      }
    };
    run();
    return () => { cancelled = true; };
  }, [filters]);

  /* Fetch owners once — only active owner accounts */
  useEffect(() => {
    adminApi.listUsers({ role: "owner", status: "active", limit: 100 }).then((res) => {
      if (res.success && res.data) setOwners(res.data.users);
    });
  }, []);

  /* Create */
  const handleCreate = async () => {
    if (!form.name || !form.ownerId || !form.contactEmail || !form.contactPhone) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    const res = await restaurantApi.create({
      name:          form.name,
      location:      form.location      || undefined,
      logoUrl:       form.logoUrl       || undefined,
      ownerId:       form.ownerId,
      managerPhone:  form.managerPhone  || undefined,
      contactEmail:  form.contactEmail,
      contactPhone:  form.contactPhone,
      businessRegNo: form.businessRegNo || undefined,
      openingHours:  hoursToApi(form.hours),
      status:        form.status,
    });
    setSaving(false);
    if (res.success && res.data) {
      const owner = owners.find((o) => o.id === res.data!.ownerId);
      setData((d) => ({
        total:       d.total + 1,
        restaurants: [{ ...res.data!, ownerName: owner?.name ?? null, ownerEmail: owner?.email ?? null, ownerPhone: owner?.phone ?? null }, ...d.restaurants],
      }));
      setAddOpen(false);
      setForm(EMPTY_FORM);
      toast.success("Restaurant created.");
    } else {
      toast.error(res.error ?? "Failed to create restaurant.");
    }
  };

  /* Edit */
  const handleEdit = async () => {
    if (!editTarget) return;
    if (!form.name || !form.ownerId || !form.contactEmail || !form.contactPhone) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    const res = await restaurantApi.update(editTarget.id, {
      name:          form.name,
      location:      form.location      || undefined,
      logoUrl:       form.logoUrl       || undefined,
      ownerId:       form.ownerId,
      managerPhone:  form.managerPhone  || undefined,
      contactEmail:  form.contactEmail,
      contactPhone:  form.contactPhone,
      businessRegNo: form.businessRegNo || undefined,
      openingHours:  hoursToApi(form.hours),
      status:        form.status,
    });
    setSaving(false);
    if (res.success && res.data) {
      const owner = owners.find((o) => o.id === res.data!.ownerId);
      const updated: AdminRestaurantItem = {
        ...res.data!,
        ownerName:  owner?.name  ?? editTarget.ownerName,
        ownerEmail: owner?.email ?? editTarget.ownerEmail,
        ownerPhone: owner?.phone ?? editTarget.ownerPhone,
      };
      setData((d) => ({ ...d, restaurants: d.restaurants.map((r) => r.id === updated.id ? updated : r) }));
      setEditTarget(null);
      setForm(EMPTY_FORM);
      toast.success("Restaurant updated.");
    } else {
      toast.error(res.error ?? "Failed to update restaurant.");
    }
  };

  /* Delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const res = await restaurantApi.delete(deleteTarget.id);
    setSaving(false);
    if (res.success) {
      setData((d) => ({ total: d.total - 1, restaurants: d.restaurants.filter((r) => r.id !== deleteTarget.id) }));
      setDeleteTarget(null);
      toast.success("Restaurant deleted.");
    } else {
      toast.error(res.error ?? "Failed to delete restaurant.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / filters.pageSize));

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>Restaurants</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            {initialLoad ? "Loading…" : `${data.total} restaurant${data.total !== 1 ? "s" : ""} on the platform`}
          </p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: "var(--dash-accent)" }}
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2.5 rounded-xl border"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
          <input
            type="text"
            placeholder="Search name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none min-w-0"
            style={{ color: "var(--dash-text-primary)" }}
          />
          {fetching && !initialLoad && (
            <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
          )}
          {searchInput && !fetching && (
            <button onClick={() => setSearchInput("")}>
              <X className="w-3.5 h-3.5" style={{ color: "var(--dash-text-secondary)" }} />
            </button>
          )}
        </div>
        <FilterSelect
          value={filters.location}
          onChange={(v) => setFilter("location", v)}
          options={[
            { value: "all", label: "All Locations" },
            ...LOCATIONS.map((loc) => ({ value: loc, label: loc })),
          ]}
        />
        <FilterSelect
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "all",       label: "All Status"  },
            { value: "active",    label: "Active"      },
            { value: "inactive",  label: "Inactive"    },
            { value: "suspended", label: "Suspended"   },
          ]}
        />
        <FilterSelect
          value={String(filters.pageSize)}
          onChange={(v) => setFilters((f) => ({ ...f, pageSize: Number(v), page: 1 }))}
          options={[
            { value: "10", label: "10 / page" },
            { value: "25", label: "25 / page" },
            { value: "50", label: "50 / page" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border" style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}>
        {/* Desktop header */}
        <div
          className="hidden sm:grid sm:grid-cols-[2fr_5.5rem_1.3fr_1.8fr_5rem_44px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--dash-text-secondary)", borderBottom: "1px solid var(--dash-card-border)" }}
        >
          <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-left hover:opacity-80 transition-opacity">
            Restaurant <SortIcon field="name" filters={filters} />
          </button>
          <span>Location</span>
          <span>Owner</span>
          <span>Contact</span>
          <span>Status</span>
          <span />
        </div>

        {initialLoad ? (
          <div className="divide-y" style={{ borderColor: "var(--dash-card-border)" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "var(--dash-bg)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded" style={{ background: "var(--dash-bg)" }} />
                  <div className="h-3 w-24 rounded" style={{ background: "var(--dash-bg)" }} />
                </div>
                <div className="h-6 w-20 rounded-full hidden sm:block" style={{ background: "var(--dash-bg)" }} />
                <div className="h-6 w-16 rounded-full hidden sm:block" style={{ background: "var(--dash-bg)" }} />
              </div>
            ))}
          </div>
        ) : data.restaurants.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>No restaurants found</p>
            <p className="text-sm mt-1" style={{ color: "var(--dash-text-secondary)" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div
            className="divide-y transition-opacity duration-150"
            style={{ borderColor: "var(--dash-card-border)", opacity: fetching ? 0.5 : 1, pointerEvents: fetching ? "none" : "auto" }}
          >
            {data.restaurants.map((r) => {
              const sm = STATUS_META[r.status];
              const openCount = DAYS.filter(({ key }) => r.openingHours?.[key] != null).length;
              const added = new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

              return (
                <div key={r.id} className="px-5 py-4 hover:bg-black/[0.015] transition-colors relative">
                  {/* Desktop */}
                  <div className="hidden sm:grid sm:grid-cols-[2fr_5.5rem_1.3fr_1.8fr_5rem_44px] gap-4 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <LogoAvatar logoUrl={r.logoUrl} name={r.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{r.name}</p>
                        {r.businessRegNo && (
                          <p className="text-xs truncate" style={{ color: "var(--dash-text-secondary)" }}>Reg: {r.businessRegNo}</p>
                        )}
                        {openCount > 0 && (
                          <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>{openCount}/7 days open</p>
                        )}
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
                        <span className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>—</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--dash-text-primary)" }}>{r.ownerName ?? "—"}</p>
                      {r.ownerPhone && <p className="text-xs truncate" style={{ color: "var(--dash-text-secondary)" }}>{r.ownerPhone}</p>}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
                        <span style={{ color: "var(--dash-text-secondary)" }}>{r.contactEmail}</span>
                      </p>
                      <p className="text-xs flex items-center gap-1.5">
                        <Phone className="w-3 h-3 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
                        <span style={{ color: "var(--dash-text-secondary)" }}>{r.contactPhone}</span>
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ color: sm.color, background: sm.bg }}
                    >
                      {sm.label}
                    </span>
                    <ActionMenu
                      menuOpen={menuId === r.id}
                      onToggle={() => setMenuId(menuId === r.id ? null : r.id)}
                      onEdit={() => { setEditTarget(r); setForm(restaurantToForm(r)); setMenuId(null); }}
                      onDelete={() => { setDeleteTarget(r); setMenuId(null); }}
                    />
                  </div>

                  {/* Mobile */}
                  <div className="flex sm:hidden items-start gap-3">
                    <LogoAvatar logoUrl={r.logoUrl} name={r.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{r.name}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>{r.contactEmail}</p>
                        </div>
                        <ActionMenu
                          menuOpen={menuId === r.id}
                          onToggle={() => setMenuId(menuId === r.id ? null : r.id)}
                          onEdit={() => { setEditTarget(r); setForm(restaurantToForm(r)); setMenuId(null); }}
                          onDelete={() => { setDeleteTarget(r); setMenuId(null); }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: sm.color, background: sm.bg }}>
                          {sm.label}
                        </span>
                        {r.location && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: locationTheme(r.location).color, background: locationTheme(r.location).bg }}>
                            {r.location}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>· {r.ownerName ?? "No owner"}</span>
                        <span className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>· {added}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!initialLoad && data.total > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>
            Showing {(filters.page - 1) * filters.pageSize + 1}–{Math.min(filters.page * filters.pageSize, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} disabled={filters.page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </PageBtn>
            {paginationRange(filters.page, totalPages).map((item, i) =>
              item === "…" ? (
                <span key={`e${i}`} className="px-2 text-sm" style={{ color: "var(--dash-text-secondary)" }}>…</span>
              ) : (
                <PageBtn key={item} onClick={() => setFilters((f) => ({ ...f, page: Number(item) }))} active={filters.page === item}>
                  {item}
                </PageBtn>
              )
            )}
            <PageBtn onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} disabled={filters.page >= totalPages}>
              <ChevronRight className="w-4 h-4" />
            </PageBtn>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addOpen && (
        <Modal title="Add Restaurant" onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); }}>
          <RestaurantFormFields form={form} owners={owners} onChange={(p) => setForm((f) => ({ ...f, ...p }))} />
          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Status</label>
            <div className="flex gap-2 mt-1.5">
              {(["active", "inactive", "suspended"] as RestaurantStatus[]).map((s) => (
                <button key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize"
                  style={form.status === s
                    ? { background: STATUS_META[s].color, color: "#fff", borderColor: "transparent" }
                    : { borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
          <ModalActions
            onCancel={() => { setAddOpen(false); setForm(EMPTY_FORM); }}
            onConfirm={handleCreate}
            confirmLabel="Create Restaurant"
            loading={saving}
            disabled={!form.name || !form.ownerId || !form.contactEmail || !form.contactPhone}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title="Edit Restaurant" onClose={() => { setEditTarget(null); setForm(EMPTY_FORM); }}>
          <RestaurantFormFields form={form} owners={owners} onChange={(p) => setForm((f) => ({ ...f, ...p }))} />
          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Status</label>
            <div className="flex gap-2 mt-1.5">
              {(["active", "inactive", "suspended"] as RestaurantStatus[]).map((s) => (
                <button key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize"
                  style={form.status === s
                    ? { background: STATUS_META[s].color, color: "#fff", borderColor: "transparent" }
                    : { borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
          <ModalActions
            onCancel={() => { setEditTarget(null); setForm(EMPTY_FORM); }}
            onConfirm={handleEdit}
            confirmLabel="Save Changes"
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete Restaurant" onClose={() => setDeleteTarget(null)} icon={<Trash2 className="w-5 h-5 text-red-500" />}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
            Permanently delete{" "}
            <strong style={{ color: "var(--dash-text-primary)" }}>{deleteTarget.name}</strong>?{" "}
            This cannot be undone.
          </p>
          <ModalActions
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            confirmLabel="Delete Restaurant"
            confirmColor="#ef4444"
            loading={saving}
          />
        </Modal>
      )}

      {menuId && <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />}
    </div>
  );
}
