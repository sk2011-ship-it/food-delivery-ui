"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import { useSite } from "@/context/SiteContext";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ShoppingBag, Clock, CheckCircle2, CreditCard,
  Package, Truck, AlertCircle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FeedbackModal from "@/components/dashboard/customer/FeedbackModal";
import OrderCard from "@/components/dashboard/customer/OrderCard";
import type { Order } from "@/types/api.types";

export interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hex: string;
  bg: string;
  description: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_CONFIRMATION: {
    label: "Confirming",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    hex: "#F59E0B",
    description: "Waiting for the restaurant to confirm your order",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50",
    hex: "#22C55E",
    description: "Confirmed — ready to proceed with payment",
  },
  PAID: {
    label: "Paid",
    icon: CreditCard,
    color: "text-blue-700",
    bg: "bg-blue-50",
    hex: "#3B82F6",
    description: "Payment received — kitchen is on it",
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "text-purple-700",
    bg: "bg-purple-50",
    hex: "#A855F7",
    description: "Chef is working on your meal",
  },
  DISPATCH_REQUESTED: {
    label: "Dispatching",
    icon: Truck,
    color: "text-orange-700",
    bg: "bg-orange-50",
    hex: "#FB923C",
    description: "Your courier is being arranged",
  },
  OUT_FOR_DELIVERY: {
    label: "On the Way",
    icon: Truck,
    color: "text-orange-700",
    bg: "bg-orange-50",
    hex: "#F97316",
    description: "Your food is on the way",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    hex: "#10B981",
    description: "Enjoy your meal!",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    hex: "#EF4444",
    description: "This order was cancelled",
  },
};

const ACTIVE_STATUSES: string[] = ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"];



export default function CustomerOrdersPage() {
  const {
    orders,
    loading,
    pagination,
    refreshOrders
  } = useOrders();
  const { replaceCart } = useCart();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [isPaying, setIsPaying] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState<string | null>(null);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = React.useState<import("@/types/api.types").Order | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "active" | "past">("all");
  const expiringOrdersRef = React.useRef<Set<string>>(new Set());

  const tabScope = activeTab === "all" ? "all" : activeTab;

  React.useEffect(() => {
    const limit = tabScope === "all" ? 20 : 100;
    void refreshOrders(1, tabScope, limit);
  }, [activeTab, refreshOrders, tabScope]);



  const handleReorder = async (orderId: string) => {
    try {
      setIsReordering(orderId);
      const order = orders.find((item) => item.id === orderId);
      const reorderItems = order?.items?.map((item) => ({
        menuItemId: item.menuItem?.id,
        quantity: item.quantity,
      })).filter((item): item is { menuItemId: string; quantity: number } => Boolean(item.menuItemId)) ?? [];

      const success = await replaceCart(reorderItems);
      if (success) {
        toast.success("Your previous items are ready in checkout.");
        router.push("/dashboard/customer/checkout");
      }
    } finally {
      setIsReordering(null);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      setIsPaying(orderId);
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${orderId}/stripe/session`, {
        method: "POST",
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
      });
      const data = await res.json();
      const sessionUrl = data.url || data.data?.url;
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        toast.error(data.message || data.error || "Failed to initialize payment session");
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsPaying(null);
    }
  };



  const handleCancel = React.useCallback(async (orderId: string) => {
    try {
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || data?.error || "Failed to cancel order.");
        return;
      }

      toast.success("Order cancelled successfully.");
      await refreshOrders();
    } catch {
      toast.error("A network error occurred. Please try again.");
    }
  }, [refreshOrders]);

  const handleExpire = React.useCallback(async (orderId: string) => {
    try {
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || data?.error || "Failed to cancel expired order.");
        return;
      }

      toast.error("Restaurant didn't respond in time. Order cancelled.");
      await refreshOrders();
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      expiringOrdersRef.current.delete(orderId);
    }
  }, [refreshOrders]);

  React.useEffect(() => {
    for (const order of orders) {
      if (expiringOrdersRef.current.has(order.id)) continue;

      if (order.status === "PENDING_CONFIRMATION") {
        const expiresAt = new Date(order.createdAt).getTime() + 10 * 60 * 1000;
        if (Date.now() >= expiresAt) {
          expiringOrdersRef.current.add(order.id);
          void handleExpire(order.id);
        }
      } else if (order.status === "CONFIRMED" && order.confirmedAt) {
        // Auto-cancel if 5-min payment window has passed
        const expiresAt = new Date(order.confirmedAt).getTime() + 5 * 60 * 1000;
        if (Date.now() >= expiresAt) {
          expiringOrdersRef.current.add(order.id);
          void handleExpire(order.id);
        }
      }
    }
  }, [orders, handleExpire]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders(1, tabScope, tabScope === "all" ? 20 : 100);
    setRefreshing(false);
  };

  const handlePageChange = async (p: number) => {
    setRefreshing(true);
    await refreshOrders(p, tabScope, tabScope === "all" ? 20 : 100);
    setRefreshing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedOrders = React.useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "active") {
      return orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
    }
    return orders.filter((order) => ["DELIVERED", "CANCELLED"].includes(order.status));
  }, [activeTab, orders]);



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: gradientFrom }} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Retrieving your feast...</p>
      </div>
    );
  }


  return (
    <div className="w-full max-w-4xl mx-auto pt-6 sm:pt-10 pb-20 px-4 sm:px-6 space-y-8">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Order History</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium italic">Manage your past cravings and track active deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={cn(
              "p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all active:scale-95",
              refreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 shadow-inner">
            {(["all", "active", "past"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner"
            style={{ background: `${gradientFrom}10` }}
          >
            <ShoppingBag className="w-10 h-10" style={{ color: gradientFrom }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900">Your stomach is waiting!</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-[280px] mx-auto">You haven&apos;t placed any orders yet. Let&apos;s find something delicious for you.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/customer")}
            className="px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Explore Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-6">
            {displayedOrders.length === 0 ? (
              <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-gray-100">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No {activeTab} orders found</p>
              </div>
            ) : (
              displayedOrders.map((order) => (
                <OrderCard
                  key={`order-${order.id}`}
                  order={order}
                  config={STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING_CONFIRMATION}
                  accent={accent}
                  gradientFrom={gradientFrom}
                  isPaying={isPaying === order.id}
                  isReordering={isReordering === order.id}
                  onPay={handlePayment}
                  onReorder={handleReorder}
                  onRate={(o) => { setSelectedOrderForFeedback(o); setIsFeedbackOpen(true); }}
                  onTrack={(id) => router.push(`/dashboard/customer/status/${id}`)}
                  onExpire={handleExpire}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && displayedOrders.length > 0 && (
            <Pagination
              total={pagination.total}
              page={pagination.page}
              limit={pagination.limit}
              onPageChange={handlePageChange}
              accent={gradientFrom}
            />
          )}
        </div>
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => { setIsFeedbackOpen(false); setSelectedOrderForFeedback(null); }}
        order={selectedOrderForFeedback}
        site={site}
        onSuccess={refreshOrders}
      />
    </div>
  );
}

function Pagination({
  total,
  page,
  limit,
  onPageChange,
  accent
}: {
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  accent?: string;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  // Simple page range calculation
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  for (let i = adjustedStart; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12 py-6">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2.5 rounded-2xl bg-white border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>

      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "w-11 h-11 rounded-2xl text-xs font-black transition-all duration-300 active:scale-90",
              page === p
                ? "text-white shadow-md scale-105"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
            )}
            style={page === p ? { background: accent || "black" } : {}}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2.5 rounded-2xl bg-white border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
      >
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
}
