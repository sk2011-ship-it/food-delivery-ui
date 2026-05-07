import { create } from "zustand";

export interface AdminOrder {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  restaurant: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    quantity: number;
    price: string;
    menuItem: {
      name: string;
    };
  }[];
}

interface AdminStats {
  totalRevenue: string;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
}

interface AdminState {
  orders: AdminOrder[];
  stats: AdminStats;
  isLoading: boolean;
  
  // Actions
  refreshOrders: () => Promise<void>;
  updateSingleOrder: (order: Partial<AdminOrder> & { id: string }) => void;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  orders: [],
  stats: {
    totalRevenue: "0",
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
  },
  isLoading: false,

  refreshOrders: async () => {
    const { session } = (await import("@/store/useAuthStore")).useAuthStore.getState();
    if (!session?.access_token) return;

    set({ isLoading: true });
    try {
      const res = await fetch(`/api/admin/orders?limit=1000&t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.data) {
        set({ 
          orders: data.data.orders,
          stats: data.data.stats
        });
      }
    } catch (err) {
      console.error("[useAdminStore] Failed to fetch orders", err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSingleOrder: (updatedOrder) => {
    set((state) => {
      const exists = state.orders.find((o) => o.id === updatedOrder.id);
      if (exists) {
        return {
          orders: state.orders.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
          ),
        };
      }
      // If it's a new order or we don't have it, we might need to refresh stats too
      // So for admin, we usually just refresh if it's a new order
      get().refreshOrders();
      return state;
    });
  },
}));
