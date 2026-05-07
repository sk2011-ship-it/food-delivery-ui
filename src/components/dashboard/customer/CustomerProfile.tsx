"use client";

import { useState } from "react";
import { Mail, Phone, User, ShieldCheck, Calendar } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useSite } from "@/context/SiteContext";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { normalizePhone, phoneDigits } from "@/lib/phone";

export default function CustomerProfile({ user }: { user: SessionUser }) {
  const { site } = useSite();
  const { gradientFrom, gradientTo, accent } = site.theme;

  const [name,  setName]  = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);

  const sanitizePhone = (value: string) => {
    return normalizePhone(value);
  };

  const isValidPhone = (value: string) => {
    const digits = phoneDigits(value);
    return digits.length >= 10 && digits.length <= 15;
  };

  const { session, setProfile } = useAuthStore();

  const handleSave = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      toast.error("Phone number is required.");
      return;
    }
    if (!isValidPhone(trimmedPhone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const normalizedPhone = sanitizePhone(phone);
      const res = await fetch("/api/customer/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name, phone: normalizedPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update global auth store state to keep the frontend in sync
      if (user.id) {
        setProfile({
          ...user,
          name,
          phone: normalizedPhone,
        });
      }

      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };


  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
          My Profile
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
          Manage your personal information
        </p>
      </div>

      {/* Avatar card */}
      <div
        className="rounded-3xl p-6 flex items-center gap-5"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {initials}
          </div>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--dash-text-primary)" }}>
            {user.name}
          </p>
          <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
            {user.email}
          </p>
          <span
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${accent}18`, color: accent }}
          >
            <ShieldCheck className="w-3 h-3" />
            Verified account
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <h2 className="text-sm font-bold" style={{ color: "var(--dash-text-primary)" }}>
          Personal Information
        </h2>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
            Full Name
          </label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-bg)" }}
          >
            <User className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--dash-text-primary)" }}
            />
          </div>
        </div>

        {/* Email — read-only */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
            Email Address
          </label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border opacity-60"
            style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-bg)" }}
          >
            <Mail className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
            <span className="flex-1 text-sm" style={{ color: "var(--dash-text-primary)" }}>
              {user.email}
            </span>
          </div>
          <p className="text-[10px] pl-1" style={{ color: "var(--dash-text-secondary)" }}>
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
            Phone Number
          </label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-bg)" }}
          >
            <Phone className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--dash-text-primary)" }}
            />
          </div>
        </div>

        {/* Member since */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "var(--dash-bg)" }}
        >
          <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
          <div>
            <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>Member since</p>
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
              {new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
