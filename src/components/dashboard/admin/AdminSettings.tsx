"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Shield, Globe, CreditCard } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";
import SignalSetup from "./SignalSetup";

interface GeneralSettings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  deliveryRadius: string;
}

interface NotificationSettings {
  emailNewOrder: boolean;
  emailNewUser: boolean;
  emailNewDriver: boolean;
  smsNewOrder: boolean;
}

export default function AdminSettings() {
  const [general, setGeneral] = useState<GeneralSettings>({
    siteName:       "",
    supportEmail:   "",
    supportPhone:   "",
    currency:       "GBP",
    timezone:       "Europe/London",
    deliveryRadius: "10",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewOrder:  true,
    emailNewUser:   true,
    emailNewDriver: false,
    smsNewOrder:    false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Fetch settings on mount ── */
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to fetch settings.");
        const json = await res.json();
        const settings = json.data;
        setGeneral({
          siteName:       settings.siteName,
          supportEmail:   settings.supportEmail,
          supportPhone:   settings.supportPhone,
          currency:       settings.currency,
          timezone:       settings.timezone,
          deliveryRadius: settings.deliveryRadius,
        });
        setNotifications(settings.notifications);
      } catch (err) {
        console.error("[AdminSettings] Fetch error:", err);
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  /* ── Save settings ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...general, notifications }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save settings.");
      }
      toast.success("Settings saved.");
    } catch (err: any) {
      console.error("[AdminSettings] Save error:", err);
      toast.error(err.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Platform configuration and preferences" />
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration and preferences" />

      <div className="space-y-6 w-full">

        {/* General */}
        <Section icon={Globe} title="General">
          <Field label="Site Name">
            <input
              value={general.siteName}
              onChange={(e) => setGeneral((g) => ({ ...g, siteName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Support Email">
            <input
              type="email"
              value={general.supportEmail}
              onChange={(e) => setGeneral((g) => ({ ...g, supportEmail: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Support Phone">
            <input
              value={general.supportPhone}
              onChange={(e) => setGeneral((g) => ({ ...g, supportPhone: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency">
              <select
                value={general.currency}
                onChange={(e) => setGeneral((g) => ({ ...g, currency: e.target.value }))}
                className={inputCls}
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select
                value={general.timezone}
                onChange={(e) => setGeneral((g) => ({ ...g, timezone: e.target.value }))}
                className={inputCls}
              >
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Dublin">Europe/Dublin</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
          </div>
          <Field label="Delivery Radius (km)">
            <input
              type="number"
              min={1}
              max={100}
              value={general.deliveryRadius}
              onChange={(e) => setGeneral((g) => ({ ...g, deliveryRadius: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Toggle
            label="Email on new order"
            checked={notifications.emailNewOrder}
            onChange={(v) => setNotifications((n) => ({ ...n, emailNewOrder: v }))}
          />
          <Toggle
            label="Email on new user registration"
            checked={notifications.emailNewUser}
            onChange={(v) => setNotifications((n) => ({ ...n, emailNewUser: v }))}
          />
          <Toggle
            label="Email on new driver sign-up"
            checked={notifications.emailNewDriver}
            onChange={(v) => setNotifications((n) => ({ ...n, emailNewDriver: v }))}
          />
          <Toggle
            label="SMS alerts on new order"
            checked={notifications.smsNewOrder}
            onChange={(v) => setNotifications((n) => ({ ...n, smsNewOrder: v }))}
          />
        </Section>

        {/* Security (static info) */}
        <Section icon={Shield} title="Security">
          <div className="text-sm text-gray-600 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Password last changed</span>
              <span className="font-medium text-gray-900">14 days ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Two-factor authentication</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Disabled</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Active sessions</span>
              <span className="font-medium text-gray-900">1 device</span>
            </div>
          </div>
        </Section>

        {/* Billing (static info) */}
        <Section icon={CreditCard} title="Billing">
          <div className="text-sm text-gray-600 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Plan</span>
              <span className="font-medium text-gray-900">Professional</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Billing cycle</span>
              <span className="font-medium text-gray-900">Monthly</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Next invoice</span>
              <span className="font-medium text-gray-900">1 May 2026</span>
            </div>
          </div>
        </Section>

        <SignalSetup />

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

/* ── Sub-components ── */

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"}`}
        style={{ height: "1.375rem", minWidth: "2.5rem" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform"
          style={{
            width: "1.125rem",
            height: "1.125rem",
            transform: checked ? "translateX(1.125rem)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white";
