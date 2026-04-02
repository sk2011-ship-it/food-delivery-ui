"use client";

import { CreditCard } from "lucide-react";

export default function AdminPayments() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-card-border)" }}
      >
        <CreditCard className="w-7 h-7" style={{ color: "var(--dash-accent)" }} />
      </div>
      <div className="text-center">
        <h2 className="text-base font-bold mb-1" style={{ color: "var(--dash-text-primary)" }}>Payments</h2>
        <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
          Payment management is coming soon.
        </p>
      </div>
    </div>
  );
}
