"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Bell, ShoppingBag, CreditCard, 
  Truck, Info, AlertCircle,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { NOTIFICATION_REFRESH_EVENT } from "@/lib/notification-events";

interface Notification {
  id: string;
  type: "ORDER" | "PAYMENT" | "DELIVERY" | "SYSTEM" | "PROMO";
  subject: string;
  body: string;
  createdAt: string;
}

const TYPE_ICONS = {
  ORDER:    { icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
  PAYMENT:  { icon: CreditCard,  color: "text-emerald-500", bg: "bg-emerald-50" },
  DELIVERY: { icon: Truck,       color: "text-orange-500", bg: "bg-orange-50" },
  SYSTEM:   { icon: Info,        color: "text-slate-500", bg: "bg-slate-50" },
  PROMO:    { icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function NotificationDrawer({
  isOpen,
  onClose,
  onNotificationsSeen,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsSeen: (notifications: Notification[]) => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const latestNotifications = data.data?.notifications ?? [];
      setNotifications(latestNotifications);
      return latestNotifications as Notification[];
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const syncNotifications = useCallback(async () => {
    const latestNotifications = await fetchNotifications();
    onNotificationsSeen(latestNotifications);
  }, [fetchNotifications, onNotificationsSeen]);

  useEffect(() => {
    if (isOpen) {
      void syncNotifications();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, syncNotifications]);

  useEffect(() => {
    const refresh = () => {
      if (isOpen) {
        void syncNotifications();
      }
    };

    window.addEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isOpen, syncNotifications]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] z-[101] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header - Styled like NavCartDrawer */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 tracking-tight">Notifications</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                {loading ? "Updating..." : `${notifications.length} Recent Alerts`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-gray-900 animate-spin" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Refreshing...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-10 text-center gap-6">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Bell className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-gray-900">All clear!</p>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                No new messages at the moment. We&apos;ll ping you as soon as something happens.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                Close Drawer
              </button>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {notifications.map((n) => {
                const meta = TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM;
                const Icon = meta.icon;
                return (
                  <div 
                    key={n.id}
                    className="p-4 rounded-[1.5rem] border border-transparent hover:border-gray-100 hover:bg-slate-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105", meta.bg)}>
                        <Icon className={cn("w-6 h-6", meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{n.subject}</h4>
                          <span className="text-[8px] font-black text-gray-300 uppercase shrink-0">
                            {formatDistanceToNow(new Date(n.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                          {n.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
