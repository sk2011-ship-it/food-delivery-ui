"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { SessionUser } from "@/lib/auth";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import CustomerBottomNav from "@/components/dashboard/customer/CustomerBottomNav";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardLayout({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isReady, session, authError, refresh } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when the actual session is gone.
    // A missing profile can happen transiently if /api/auth/me is slow or fails.
    if (isReady && !session) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isReady, session, router]);

  useEffect(() => {
    // Handle BFCache (Back-Forward Cache) — if the page is loaded from cache
    // when clicking the back button, force a reload to re-run auth checks.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const isCustomer = user.role === "customer";
  const showAuthRecovery = Boolean(authError && session);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--dash-bg)" }}>
      {/* Sidebar — always visible on desktop; on mobile only for non-customer roles */}
      <DashboardSidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay — only for non-customer (customer uses bottom nav) */}
      {sidebarOpen && !isCustomer && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          hideMenuButton={isCustomer}
        />
        {showAuthRecovery && (
          <div className="mx-4 md:mx-6 lg:mx-8 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium truncate">{authError}</p>
            </div>
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 ${isCustomer ? "pb-24 lg:pb-8" : ""}`}>
          {children}
        </main>
      </div>

      {/* Customer mobile bottom tab navigation */}
      {isCustomer && <CustomerBottomNav />}
    </div>
  );
}
