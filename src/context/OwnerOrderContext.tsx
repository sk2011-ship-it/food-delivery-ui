"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface OwnerOrder {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    price: string;
    menuItem: {
      name: string;
      imageUrl?: string;
    };
  }[];
  restaurant: {
    name: string;
  };
}

interface OwnerOrderContextType {
  orders: OwnerOrder[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  ownedRestaurantIds: string[];
}

const OwnerOrderContext = createContext<OwnerOrderContextType | undefined>(undefined);
const supabase = createClient();

export function OwnerOrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [ownedRestaurantIds, setOwnedRestaurantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const ownedRestaurantIdsRef = useRef<string[]>([]);
  
  const fetchOrders = useCallback(async (targetOrderId?: string, isRetry = false) => {
    try {
      console.log(`🔄 [OWNER] Syncing data... (isRetry: ${isRetry})`);
      // Cache busting with timestamp ensures the browser never serves stale data
      const res = await fetch(`/api/owner/orders?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      
      if (data.data) {
        const fetchedOrders = data.data.orders as OwnerOrder[];
        setOrders(fetchedOrders);
        console.log(`✅ [OWNER] Fetched ${fetchedOrders.length} orders.`);

        if (data.data.ownedRestaurantIds) {
          setOwnedRestaurantIds(data.data.ownedRestaurantIds);
          ownedRestaurantIdsRef.current = data.data.ownedRestaurantIds;
        }

        // If we were expecting a specific new order, verify it's there
        if (targetOrderId) {
          const found = fetchedOrders.some(o => o.id === targetOrderId);
          if (found) {
            console.log(`🎯 [OWNER] New order ${targetOrderId} successfully found in list.`);
          } else if (!isRetry) {
            console.warn(`⚠️ [OWNER] New order ${targetOrderId} NOT found yet. Retrying in 1.5s...`);
            setTimeout(() => fetchOrders(targetOrderId, true), 1500);
          } else {
            console.error(`❌ [OWNER] New order ${targetOrderId} still missing after retry.`);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch owner orders:", err);
    } finally {
      if (!isRetry) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        // Step 1: Check authentication and role from /api/auth/me
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          if (active) setLoading(false);
          return;
        }
        
        const { data: userData } = await authRes.json();
        
        // Step 2: ONLY proceed if the user is an owner
        if (userData?.role !== "owner") {
          console.log("🛡️ [OWNER] Current user is not an owner. Skipping order sync.");
          if (active) setLoading(false);
          return;
        }

        console.log("🏪 [OWNER] Owner verified. Starting order synchronization...");
        
        // 1. Initial fetch
        await fetchOrders();

        // 2. Listen for auth changes to refetch when the user logs in as owner
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event: any) => {
          if (event === "SIGNED_IN") {
            console.log("🔐 [OWNER] Auth state changed (SIGNED_IN), refetching...");
            fetchOrders();
          }
        });

        // 3. ── Supabase Realtime Subscription ──────────────────────────
        const channel = supabase
          .channel("owner_orders_realtime_dashboard")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            async (payload: any) => {
              console.log("🔔 [OWNER] Realtime update received:", payload);
              
              if (payload.eventType === "INSERT") {
                const newOrder = payload.new;
                
                if (ownedRestaurantIdsRef.current.includes(newOrder.restaurant_id)) {
                  console.log("🎯 [OWNER] Relevant new order detected!", newOrder.id);
                  toast.info("A new order just landed at your restaurant!", { icon: "🔔" });
                  fetchOrders(newOrder.id);
                }
              } else if (payload.eventType === "UPDATE") {
                const row = payload.new;
                const mappedRow = {
                  id: row.id,
                  userId: row.user_id,
                  restaurantId: row.restaurant_id,
                  status: row.status,
                  totalAmount: row.total_amount,
                  updatedAt: row.updated_at,
                };
                
                setOrders((prev) => 
                   prev.map((o) => (o.id === row.id ? { ...o, ...mappedRow } : o))
                );

                if (row.status === "PAID") {
                  toast.success("Payment confirmed for an order!", { icon: "💰" });
                }
              } else if (payload.eventType === "DELETE") {
                setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
              }
            }
          )
          .subscribe((status: string) => {
            console.log("📡 [OWNER] Realtime sync status:", status);
          });

        return () => {
          authListener.unsubscribe();
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("OwnerOrderProvider init failed:", err);
        if (active) setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    // 1. Store previous state for rollback
    const previousOrders = [...orders];

    // 2. Optimistically update local state
    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );

    try {
      const res = await fetch(`/api/owner/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Rollback on failure
        setOrders(previousOrders);
        toast.error(data.message || "Failed to update status");
        return false;
      }

      toast.success(`Order status updated to ${status}`);
      return true;
    } catch (err) {
      // Rollback on network error
      setOrders(previousOrders);
      toast.error("Network error: Failed to update order status");
      return false;
    }
  };

  return (
    <OwnerOrderContext.Provider value={{ orders, loading, refreshOrders: fetchOrders, updateOrderStatus, ownedRestaurantIds }}>
      {children}
    </OwnerOrderContext.Provider>
  );
}

export const useOwnerOrders = () => {
  const context = useContext(OwnerOrderContext);
  if (!context) throw new Error("useOwnerOrders must be used within an OwnerOrderProvider");
  return context;
};
