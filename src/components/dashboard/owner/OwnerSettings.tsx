"use client";

import { useState, useEffect } from "react";
import { 
  Save, Globe, Loader2, Store, MapPin, 
  Mail, Phone, ChevronDown, Clock 
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { ownerRestaurantApi, type AdminRestaurantItem, type OpeningHours, type DayKey } from "@/lib/api";
import { LOCATIONS } from "@/lib/locations";
import { toast } from "sonner";

/* ── Hours Types ── */
type DayHoursRow = { enabled: boolean; open: string; close: string };
type HoursForm   = Record<DayKey, DayHoursRow>;

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday",    short: "Mon" },
  { key: "tue", label: "Tuesday",   short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday",  short: "Thu" },
  { key: "fri", label: "Friday",    short: "Fri" },
  { key: "sat", label: "Saturday",  short: "Sat" },
  { key: "sun", label: "Sunday",    short: "Sun" },
];

const DEFAULT_HOURS: HoursForm = Object.fromEntries(
  DAYS.map(({ key }) => [key, { enabled: false, open: "09:00", close: "22:00" }])
) as HoursForm;

function apiToHours(oh: OpeningHours | null | undefined): HoursForm {
  const f = structuredClone(DEFAULT_HOURS);
  if (!oh) return f;
  for (const { key } of DAYS) {
    const d = oh[key];
    f[key] = d ? { enabled: true, open: d.open, close: d.close } : { enabled: false, open: "09:00", close: "22:00" };
  }
  return f;
}

function hoursToApi(h: HoursForm): OpeningHours {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, h[key].enabled ? { open: h[key].open, close: h[key].close } : null])
  ) as OpeningHours;
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
export default function OwnerSettings() {
  const [restaurants, setRestaurants] = useState<AdminRestaurantItem[]>([]);
  const [selectedId,  setSelectedId]  = useState<string>("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  // Form state
  const [form, setForm] = useState({
    name:         "",
    location:     "",
    logoUrl:      "",
    contactEmail: "",
    contactPhone: "",
    hours:        structuredClone(DEFAULT_HOURS),
  });

  /* 1. Fetch restaurants on mount */
  useEffect(() => {
    ownerRestaurantApi.list().then((res) => {
      setLoading(false);
      if (res.success && res.data?.items.length) {
        setRestaurants(res.data.items);
        setSelectedId(res.data.items[0].id);
      }
    });
  }, []);

  /* 2. When selection changes, load that restaurant's details */
  useEffect(() => {
    if (!selectedId) return;
    const r = restaurants.find((item) => item.id === selectedId);
    if (r) {
      setForm({
        name:         r.name,
        location:     r.location || "",
        logoUrl:      r.logoUrl  || "",
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        hours:        apiToHours(r.openingHours),
      });
    }
  }, [selectedId, restaurants]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await ownerRestaurantApi.update(selectedId, {
      name:         form.name,
      location:     form.location || undefined,
      logoUrl:      form.logoUrl  || undefined,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      openingHours: hoursToApi(form.hours),
    });
    setSaving(false);

    if (res.success) {
      toast.success("Restaurant settings updated.");
      // Update local item in list so if they switch back/forth it's fresh
      setRestaurants(prev => prev.map(r => r.id === selectedId ? { ...r, ...res.data! } : r));
    } else {
      toast.error(res.error || "Failed to save settings.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-3xl">
        <Store className="w-12 h-12 mx-auto text-gray-200 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">No restaurants found</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
          You don't have any restaurants assigned to your account yet. 
          Please contact administration to set up your business.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your restaurant profile and operating hours" />

      {/* Restaurant Selector (only if multiple) */}
      {restaurants.length > 1 && (
        <div className="mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-0.5">Switch Restaurant</label>
            <div className="relative max-w-sm">
              <select 
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-10 pl-0 pr-8 bg-transparent text-sm font-bold text-gray-900 outline-none appearance-none cursor-pointer"
              >
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Basic Information */}
        <div className="space-y-6">
          <Section icon={Store} title="Business Profile">
            <Field label="Restaurant Name">
              <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <Store className="w-4 h-4 text-gray-400" />
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </Field>

            <Field label="Location">
              <div className="relative">
                <select 
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full h-11 pl-10 pr-8 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none appearance-none"
                >
                  <option value="">— Select Location —</option>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <Field label="Logo URL">
              <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <Globe className="w-4 h-4 text-gray-400" />
                <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </Field>
          </Section>

          <Section icon={Phone} title="Contact Details">
             <Field label="Email Address">
              <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <Mail className="w-4 h-4 text-gray-400" />
                <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </Field>
            <Field label="Phone Number">
              <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <Phone className="w-4 h-4 text-gray-400" />
                <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </Field>
          </Section>
        </div>

        {/* Operating Hours */}
        <div className="space-y-6">
          <Section icon={Clock} title="Operating Hours">
            <HoursEditor hours={form.hours} onChange={hours => setForm(f => ({ ...f, hours }))} />
          </Section>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/30">
        <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-100/50">
          <Icon className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      {children}
    </div>
  );
}

function HoursEditor({ hours, onChange }: { hours: HoursForm; onChange: (h: HoursForm) => void }) {
  const toggle = (key: DayKey) => onChange({ ...hours, [key]: { ...hours[key], enabled: !hours[key].enabled } });
  const setTime = (key: DayKey, field: "open" | "close", val: string) => onChange({ ...hours, [key]: { ...hours[key], [field]: val } });

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const row = hours[key];
        return (
          <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50/50 transition-colors hover:bg-white hover:border-gray-200">
            <div className="flex items-center gap-3">
               <button
                type="button"
                onClick={() => toggle(key)}
                className={`relative w-8 h-4.5 rounded-full transition-colors ${row.enabled ? "bg-green-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${row.enabled ? "translate-x-3.5" : "translate-x-0"}`} />
              </button>
              <span className={`text-xs font-bold ${row.enabled ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
            </div>

            {row.enabled ? (
              <div className="flex items-center gap-2">
                <input type="time" value={row.open} onChange={e => setTime(key, "open", e.target.value)} className="text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-100 bg-white outline-none focus:border-gray-300" />
                <span className="text-gray-300">—</span>
                <input type="time" value={row.close} onChange={e => setTime(key, "close", e.target.value)} className="text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-100 bg-white outline-none focus:border-gray-300" />
              </div>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
