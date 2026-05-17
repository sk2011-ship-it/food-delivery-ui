"use client";

import { useState, useEffect } from "react";
import { Power } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminSettings() {
  const [platformOpen, setPlatformOpen] = useState(true);
  const [loading,      setLoading]      = useState(true);
  const { session } = useAuthStore();

  useEffect(() => {
    fetch("/api/admin/platform-status", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (typeof d.data?.open === "boolean") setPlatformOpen(d.data.open); })
      .catch(() => toast.error("Failed to load platform status."))
      .finally(() => setLoading(false));
  }, [session]);

  const toggle = () => {
    const next = !platformOpen;
    // Flip immediately — instant UI response
    setPlatformOpen(next);
    toast.success(next ? "Platform is now OPEN — orders enabled." : "Platform is now OFFLINE — orders blocked.");

    // Sync to DB in background
    fetch("/api/admin/platform-status", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ open: next }),
    }).then((res) => {
      if (!res.ok) {
        // Revert if server failed
        setPlatformOpen(!next);
        toast.error("Failed to save — reverted.");
      }
    }).catch(() => {
      setPlatformOpen(!next);
      toast.error("Failed to save — reverted.");
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Platform configuration" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <Power className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Platform Status</h2>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {platformOpen ? "Platform is Open" : "Platform is Offline"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {platformOpen
                    ? "Customers can browse and place orders normally."
                    : "All new order submissions are blocked. Customers see a maintenance message."}
                </p>
              </div>

              <button
                onClick={toggle}
                className={`relative shrink-0 transition-colors rounded-full ${
                  platformOpen ? "bg-gray-900" : "bg-gray-200"
                }`}
                style={{ width: "2.75rem", height: "1.5rem" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform"
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    transform: platformOpen ? "translateX(1.25rem)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
