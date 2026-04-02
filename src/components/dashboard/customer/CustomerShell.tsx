"use client";

import type { SessionUser } from "@/lib/auth";
import CustomerNavbar from "./CustomerNavbar";
import CustomerBottomNav from "./CustomerBottomNav";

export default function CustomerShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--dash-bg)" }}>
      <CustomerNavbar user={user} />
      {/* pt-16 = navbar height, pb-20 lg:pb-0 = bottom nav clearance */}
      <main className="pt-16 pb-20 lg:pb-0">
        {children}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
