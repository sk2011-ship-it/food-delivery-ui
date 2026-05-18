"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useFcmToken } from "@/hooks/useFcmToken";
import { useAuthStore } from "@/store/useAuthStore";
import { useOwnerStore, OwnerOrder } from "@/store/useOwnerStore";

interface OwnerOrderContextType {
  orders: OwnerOrder[];
  historyOrders: OwnerOrder[];
  loading: boolean;
  refreshOrders: (params?: { scope?: "active" | "history"; page?: number; status?: string }) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  ownedRestaurantIds: string[];
  pagination: { total: number; page: number; limit: number };
  historyPagination: { total: number; page: number; limit: number };
  historyStats: { totalRevenue: number; deliveredCount: number; cancelledCount: number };
}

const OwnerOrderContext = createContext<OwnerOrderContextType | undefined>(undefined);

export function OwnerOrderProvider({ children }: { children: React.ReactNode }) {
  const {
    orders,
    historyOrders,
    ownedRestaurantIds,
    isLoading: loading,
    pagination,
    historyPagination,
    historyStats,
    refreshOrders,
    updateOrderStatus: storeUpdateOrderStatus
  } = useOwnerStore();

  const { session, isReady, user, role } = useAuthStore();
  const userId = user?.id;

  // Register FCM
  useFcmToken(userId);

  useEffect(() => {
    if (!isReady) return;

    if (session && (role === "owner" || role === "admin")) {
      console.log("[OwnerOrderContext] Syncing with owner store...");
      refreshOrders().catch(() => { });
    };
  }, [session, isReady, role, refreshOrders]);

  // Refresh instantly when owner switches back to this tab
  useEffect(() => {
    if (!session || !(role === "owner" || role === "admin")) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("[OwnerOrderContext] Tab visible — refreshing orders");
        refreshOrders().catch(() => { });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [session, role, refreshOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    return await storeUpdateOrderStatus(id, status);
  };

  return (
    <OwnerOrderContext.Provider value={{ 
      orders, 
      historyOrders, 
      loading, 
      refreshOrders, 
      updateOrderStatus, 
      ownedRestaurantIds, 
      pagination,
      historyPagination,
      historyStats
    }}>
      {children}
    </OwnerOrderContext.Provider>
  );
}

export const useOwnerOrders = () => {
  const context = useContext(OwnerOrderContext);
  if (!context) throw new Error("useOwnerOrders must be used within an OwnerOrderProvider");
  return context;
};
