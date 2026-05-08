"use client";

import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Menu, LogOut, Bell } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import NotificationDropdown from "./NotificationDropdown";
import { NOTIFICATION_REFRESH_EVENT } from "@/lib/notification-events";
import { getUnreadNotificationCount, markNotificationsSeen } from "@/lib/notification-state";

const roleBadge: Record<string, string> = {
  owner:    "bg-purple-100 text-purple-700",
  admin:    "bg-blue-100 text-blue-700",
  driver:   "bg-amber-100 text-amber-700",
  customer: "bg-orange-100 text-orange-600",
};

export default function DashboardHeader({
  user,
  onMenuClick,
  hideMenuButton = false,
}: {
  user: SessionUser;
  onMenuClick: () => void;
  hideMenuButton?: boolean;
}) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);

  const refreshNotificationCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const notifications = data.data?.notifications ?? [];
      setNotificationCount(getUnreadNotificationCount(user.id, notifications));
    } catch (err) {
      console.error("Failed to refresh notification badge:", err);
    }
  }, [user.id]);

  const handleNotificationsSeen = useCallback(
    (notifications: { createdAt: string }[]) => {
      markNotificationsSeen(user.id, notifications);
      setNotificationCount(0);
    },
    [user.id]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshNotificationCount();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshNotificationCount]);

  useEffect(() => {
    const refresh = () => {
      void refreshNotificationCount();
    };

    window.addEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refreshNotificationCount]);

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    toast.success("Logged out.");
    router.push("/login");
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 relative"
      style={{
        background:   "var(--dash-header-bg)",
        borderBottom: "1px solid var(--dash-header-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={`${hideMenuButton ? "hidden" : "lg:hidden"} p-2 rounded-lg hover:bg-gray-100 transition-colors`}
        >
          <Menu className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
        </button>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
            Hi, {user.name.split(" ")[0]}
          </p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[user.role]}`}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            ref={bellRef}
            onClick={() => {
              setNotificationCount(0);
              setIsNotificationsOpen((open) => !open);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <Bell className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black leading-5 text-center border border-white shadow-sm">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
          
          <NotificationDropdown 
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNotificationsSeen={handleNotificationsSeen}
          />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: "var(--dash-text-secondary)" }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
