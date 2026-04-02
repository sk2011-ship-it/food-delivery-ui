"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, MapPin, Shield, Trash2, LogOut,
  ChevronRight, Moon, Smartphone,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useSite } from "@/context/SiteContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

function Toggle({ on, onToggle, accentColor }: { on: boolean; onToggle: () => void; accentColor: string }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? accentColor : "#d1d5db" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  sub,
  action,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  action: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4 px-1">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: danger ? "#fef2f2" : "var(--dash-bg)" }}
      >
        <Icon className="w-4 h-4" style={{ color: danger ? "#ef4444" : "var(--dash-text-secondary)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? "#ef4444" : "var(--dash-text-primary)" }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            {sub}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default function CustomerSettings({ user: _user }: { user: SessionUser }) {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [notifOrders,   setNotifOrders]   = useState(true);
  const [notifPromos,   setNotifPromos]   = useState(false);
  const [darkMode,      setDarkMode]      = useState(false);
  const [smsUpdates,    setSmsUpdates]    = useState(true);
  const [loggingOut,    setLoggingOut]    = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await authApi.logout();
    toast.success("Logged out.");
    router.push("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
          Manage your preferences and account
        </p>
      </div>

      {/* Notifications */}
      <div
        className="rounded-3xl px-5 divide-y"
        style={{
          background: "var(--dash-card)",
          border: "1px solid var(--dash-card-border)",
          divideColor: "var(--dash-card-border)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: "var(--dash-text-secondary)" }}>
          Notifications
        </p>
        <SettingRow
          icon={Bell}
          label="Order updates"
          sub="Get notified when your order status changes"
          action={<Toggle on={notifOrders} onToggle={() => setNotifOrders(!notifOrders)} accentColor={gradientFrom} />}
        />
        <SettingRow
          icon={Bell}
          label="Promotions & offers"
          sub="Deals, discounts and special offers"
          action={<Toggle on={notifPromos} onToggle={() => setNotifPromos(!notifPromos)} accentColor={gradientFrom} />}
        />
        <SettingRow
          icon={Smartphone}
          label="SMS updates"
          sub="Text messages for delivery tracking"
          action={<Toggle on={smsUpdates} onToggle={() => setSmsUpdates(!smsUpdates)} accentColor={gradientFrom} />}
        />
      </div>

      {/* Preferences */}
      <div
        className="rounded-3xl px-5 divide-y"
        style={{
          background: "var(--dash-card)",
          border: "1px solid var(--dash-card-border)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: "var(--dash-text-secondary)" }}>
          Preferences
        </p>
        <SettingRow
          icon={Moon}
          label="Dark mode"
          sub="Switch to a darker interface"
          action={<Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} accentColor={gradientFrom} />}
        />
        <SettingRow
          icon={MapPin}
          label="Saved addresses"
          sub="Manage your delivery locations"
          action={<ChevronRight className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />}
        />
      </div>

      {/* Account */}
      <div
        className="rounded-3xl px-5 divide-y"
        style={{
          background: "var(--dash-card)",
          border: "1px solid var(--dash-card-border)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: "var(--dash-text-secondary)" }}>
          Account
        </p>
        <SettingRow
          icon={Shield}
          label="Privacy & security"
          sub="Password, two-factor authentication"
          action={<ChevronRight className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />}
        />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left disabled:opacity-60"
        >
          <SettingRow
            icon={LogOut}
            label={loggingOut ? "Logging out…" : "Log out"}
            sub="Sign out of your account"
            action={<ChevronRight className="w-4 h-4 text-red-400" />}
            danger
          />
        </button>
        <SettingRow
          icon={Trash2}
          label="Delete account"
          sub="Permanently remove your data"
          action={<ChevronRight className="w-4 h-4 text-red-400" />}
          danger
        />
      </div>

      {/* Version */}
      <p className="text-center text-xs pb-2" style={{ color: "var(--dash-text-secondary)" }}>
        Eats Platform v1.0.0
      </p>
    </div>
  );
}
