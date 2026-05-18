import { create } from "zustand";
import { ownerService } from "@/services/owner.service";
import { toast } from "sonner";

/**
 * useOwnerStore.ts - Real-time dashboard for restaurant owners.
 * Manages live orders and kitchen state transitions.
 */

export interface OwnerOrder {
  id: string;
  userId: string | null;
  restaurantId: string;
  status: string;
  totalAmount: string;
  confirmedAt: string | null;
  paidAt: string | null;
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
  deliveryJob?: {
    status: string | null;
    trackingUrl: string | null;
    driverName: string | null;
    driverPhone: string | null;
    eta: string | null;
  };
}

interface OwnerState {
  orders: OwnerOrder[];
  historyOrders: OwnerOrder[];
  ownedRestaurantIds: string[];
  isLoading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  historyPagination: {
    total: number;
    page: number;
    limit: number;
  };
  historyStats: {
    totalRevenue: number;
    deliveredCount: number;
    cancelledCount: number;
  };
  
  // Actions
  refreshOrders: (params?: { scope?: "active" | "history"; page?: number; status?: string }) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  updateSingleOrder: (order: Partial<OwnerOrder> & { id: string }) => void;
}

type OwnerOrdersResponse = {
  orders?: OwnerOrder[];
  ownedRestaurantIds?: string[];
  stats?: {
    totalRevenue: number;
    deliveredCount: number;
    cancelledCount: number;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
};

export const useOwnerStore = create<OwnerState>()((set, get) => ({
  orders: [],
  historyOrders: [],
  ownedRestaurantIds: [],
  isLoading: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 50,
  },
  historyPagination: {
    total: 0,
    page: 1,
    limit: 10,
  },
  historyStats: {
    totalRevenue: 0,
    deliveredCount: 0,
    cancelledCount: 0,
  },

  refreshOrders: async (params) => {
    set({ isLoading: true });
    try {
      const scope = params?.scope ?? "active";
      const status = params?.status;
      const currentPage = params?.page ?? (scope === "history" ? get().historyPagination.page : get().pagination.page);
      
      const response = await ownerService.getLiveOrders({ 
        page: currentPage,
        scope,
        status
      });
      const data = response.data;
      const normalizedData: OwnerOrdersResponse = Array.isArray(data)
        ? { orders: data as OwnerOrder[] }
        : ((data as OwnerOrdersResponse | undefined) ?? {});
      
      const fetchedOrders = normalizedData.orders ?? [];
      const fetchedRestaurantIds = normalizedData.ownedRestaurantIds ?? [];
      const paginationData = normalizedData.pagination ?? (scope === "history" ? get().historyPagination : get().pagination);
      const fetchedStats = normalizedData.stats;
      
      if (scope === "history") {
        set({ 
          historyOrders: fetchedOrders,
          ownedRestaurantIds: fetchedRestaurantIds,
          historyPagination: paginationData,
          ...(fetchedStats ? { historyStats: fetchedStats } : {})
        });
      } else {
        set({ 
          orders: fetchedOrders,
          ownedRestaurantIds: fetchedRestaurantIds,
          pagination: paginationData
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    const previousOrders = [...get().orders];
    
    // Optimistic update
    set({
      orders: previousOrders.map((o) => (o.id === id ? { ...o, status } : o)),
    });

    const res = await ownerService.updateOrderStatus(id, status);
    if (!res.success) {
      toast.error(res.error || "Failed to update order status");
      set({ orders: previousOrders }); // Rollback
      return false;
    }

    const serverOrder = (res.data as { order?: OwnerOrder } | undefined)?.order;
    if (serverOrder) {
      const isHistorical = serverOrder.status === 'DELIVERED' || serverOrder.status === 'CANCELLED';
      
      if (isHistorical) {
        // Remove from live if it was there
        set({
          orders: get().orders.filter(o => o.id !== id),
          historyOrders: [serverOrder, ...get().historyOrders.filter(o => o.id !== id)]
        });
      } else {
        set({
          orders: get().orders.map((o) => (o.id === id ? { ...o, ...serverOrder } : o)),
        });
      }
    }
    
    toast.success(`Order #${id.slice(0, 6)} updated to ${serverOrder?.status ?? status}`);
    return true;
  },

  updateSingleOrder: (updatedOrder) => {
    const state = get();
    const exists = state.orders.find((o) => o.id === updatedOrder.id);
    if (exists) {
      set({
        orders: state.orders.map((o) =>
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        ),
      });
    } else {
      // Order is brand-new — always refresh to get its full data from the server
      get().refreshOrders();
    }
  },
}));
