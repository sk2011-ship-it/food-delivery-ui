import { create } from "zustand";
import { customerService } from "@/services/customer.service";
import { toast } from "sonner";
import type { Order } from "@/types/api.types";

/**
 * useOrderStore.ts - Real-time order management and history tracking.
 */

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  currentScope: "all" | "active" | "past";
  currentLimit: number;

  // Actions
  refreshOrders: (page?: number, scope?: "all" | "active" | "past", limit?: number) => Promise<void>;
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => Promise<void>;
  updateSingleOrder: (order: Partial<Order> & { id: string }) => void;
  reorder: (orderId: string) => Promise<{ success: boolean; orderId?: string }>;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  isLoading: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
  },
  currentScope: "all",
  currentLimit: 20,

  refreshOrders: async (page, scope = "all", limit = 20) => {
    set({ isLoading: true });
    try {
      const currentPage = page ?? get().pagination.page;
      const { success, data } = await customerService.getOrders({ page: currentPage, scope, limit });
      if (success && data) {
        set({ 
          orders: data.orders,
          pagination: data.pagination ?? get().pagination,
          currentScope: scope,
          currentLimit: limit,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (id, status, paymentIntentId) => {
    const previousOrders = [...get().orders];

    // Optimistic update
    set({
      orders: previousOrders.map((o) =>
        o.id === id ? { ...o, status, paymentIntentId } : o
      ),
    });

    const res = await customerService.updateOrderStatus(id, status, paymentIntentId);
    if (!res.success) {
      toast.error("Failed to update order status on server");
      set({ orders: previousOrders }); // Rollback
    }
  },

  updateSingleOrder: async (updatedOrder) => {
    console.log(`[useOrderStore] Received ping for order ${updatedOrder.id}. Fetching latest state from server...`);
    const state = get();
    const exists = state.orders.some((o) => o.id === updatedOrder.id);

    // If we don't already have the order in local state, a list refresh is
    // more reliable than probing the single-order endpoint and logging noise.
    if (!exists) {
      await get().refreshOrders(state.pagination.page, state.currentScope, state.currentLimit);
      return;
    }

    let response = await customerService.getOrderById(updatedOrder.id);

    if (!response.success) {
      console.warn(`[useOrderStore] Order ${updatedOrder.id} not found on first attempt. Retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await customerService.getOrderById(updatedOrder.id);
    }

    if (response.success && response.data) {
      const serverOrder = response.data;
      const currentState = get();

      if (serverOrder.sessionId) {
        console.log(`[useOrderStore] Order ${serverOrder.id} belongs to session ${serverOrder.sessionId}. Refreshing current order list to resync sibling state.`);
        await get().refreshOrders(currentState.pagination.page, currentState.currentScope, currentState.currentLimit);
        return;
      }

      if (currentState.orders.some((o) => o.id === serverOrder.id)) {
        set({
          orders: currentState.orders.map((o) =>
            o.id === serverOrder.id ? serverOrder : o
          ),
        });
        console.log(`[useOrderStore] Successfully synced existing order ${serverOrder.id} to status ${serverOrder.status}`);
      } else {
        set({
          orders: [serverOrder, ...currentState.orders].filter((o, idx, self) => 
            self.findIndex(other => other.id === o.id) === idx
          )
        });
        console.log(`[useOrderStore] Successfully fetched and prepended new order ${serverOrder.id}`);
      }
    } else {
      console.error(`[useOrderStore] Failed to fetch order ${updatedOrder.id} after retry. Refreshing all orders.`);
      await get().refreshOrders();
    }
  },
  reorder: async (orderId: string) => {
    set({ isLoading: true });
    try {
      const { success, data } = await customerService.reorder(orderId);
      if (success && data?.order) {
        toast.success("Order duplicated successfully!");
        // We don't manually add to state, as we want to maintain the correct sort order.
        // refreshOrders will fetch the new list.
        await get().refreshOrders();
        return { success: true, orderId: data.order.id };
      } else {
        toast.error("Failed to reorder. Please try again.");
        return { success: false };
      }
    } catch {
      toast.error("A network error occurred.");
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },
}));
