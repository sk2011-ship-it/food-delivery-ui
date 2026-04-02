"use client";

import { Star } from "lucide-react";

export default function AdminFeatured() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-card-border)" }}
      >
        <Star className="w-7 h-7" style={{ color: "var(--dash-accent)" }} />
      </div>
      <div className="text-center">
        <h2 className="text-base font-bold mb-1" style={{ color: "var(--dash-text-primary)" }}>Featured</h2>
        <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
          Feature management is coming soon.
        </p>
      </div>
    </div>
  );
}
