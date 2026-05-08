"use client";

import { useState } from "react";
import { Save, User, Bell, Car, Shield } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/auth";

export default function DriverSettings({ user }: { user: SessionUser }) {
  const [profile, setProfile] = useState({
    name:         user.name,
    email:        user.email,
    phone:        user.phone,
    vehicleType:  "car",
    licensePlate: "SG24 XYZ",
    vehicleModel: "Toyota Corolla",
  });

  const [notifications, setNotifications] = useState({
    newOrderAlert:    true,
    earningsSummary:  true,
    promotionalOffers:false,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved.");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your driver profile and preferences" />

      <div className="space-y-6 w-full">

        {/* Profile */}
        <Section icon={User} title="Profile">
          <Field label="Full Name">
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Vehicle */}
        <Section icon={Car} title="Vehicle">
          <Field label="Vehicle Type">
            <select
              value={profile.vehicleType}
              onChange={(e) => setProfile((p) => ({ ...p, vehicleType: e.target.value }))}
              className={inputCls}
            >
              <option value="bicycle">Bicycle</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
            </select>
          </Field>
          <Field label="Vehicle Model">
            <input
              value={profile.vehicleModel}
              onChange={(e) => setProfile((p) => ({ ...p, vehicleModel: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="License Plate">
            <input
              value={profile.licensePlate}
              onChange={(e) => setProfile((p) => ({ ...p, licensePlate: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Toggle
            label="New order alerts"
            checked={notifications.newOrderAlert}
            onChange={(v) => setNotifications((n) => ({ ...n, newOrderAlert: v }))}
          />
          <Toggle
            label="Weekly earnings summary"
            checked={notifications.earningsSummary}
            onChange={(v) => setNotifications((n) => ({ ...n, earningsSummary: v }))}
          />
          <Toggle
            label="Promotional offers"
            checked={notifications.promotionalOffers}
            onChange={(v) => setNotifications((n) => ({ ...n, promotionalOffers: v }))}
          />
        </Section>

        {/* Security */}
        <Section icon={Shield} title="Security">
          <div className="text-sm text-gray-600 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Password last changed</span>
              <span className="font-medium text-gray-900">21 days ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <button
                onClick={() => toast.info("Password reset — coming soon.")}
                className="text-gray-900 font-semibold text-sm hover:underline"
              >
                Change password →
              </button>
            </div>
          </div>
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative rounded-full transition-colors"
        style={{ width: "2.5rem", height: "1.375rem", background: checked ? "#111827" : "#e5e7eb" }}
      >
        <span
          className="absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform"
          style={{ width: "1.125rem", height: "1.125rem", transform: checked ? "translateX(1.125rem)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white";
