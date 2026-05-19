"use client";

/**
 * AiSuggestionPopup
 *
 * Non-intrusive bottom card — slides up from the bottom of the screen
 * WITHOUT a backdrop so the main order tracking page stays fully visible.
 *
 * Only rendered when there is a real AI suggestion (never shown empty).
 *
 * Flow:
 *   Phase 1 "suggestion" — show alternative + Keep Waiting / Try This
 *   Phase 2 "reason"     — select cancel reason + confirm
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Zap, Clock, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useCart } from "@/context/CartContext";
import { useOrderStore } from "@/store/useOrderStore";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AiSuggestion = {
  restaurantId: string;
  restaurantName: string;
  restaurantLogoUrl: string | null;
  avgAcceptanceMinutes: number;
  aiReason: string;
  dish: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
  };
};

const CANCEL_REASONS = [
  { key: "waiting_too_long", label: "Waiting too long" },
  { key: "wrong_order",      label: "I placed the wrong order" },
  { key: "changed_mind",     label: "Changed my mind" },
  { key: "other",            label: "Other reason" },
] as const;

// ── Props ──────────────────────────────────────────────────────────────────────

type DeliveryDetails = {
  deliveryAddress: string;
  deliveryArea: string;
  customerPhone: string;
  deliveryFee: number;
  siteLocation: string;
};

type Props = {
  orderId: string;
  suggestion: AiSuggestion;
  deliveryDetails: DeliveryDetails;
  onDismiss: () => void;
  onCancelled: () => void;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AiSuggestionPopup({ orderId, suggestion, deliveryDetails, onDismiss, onCancelled }: Props) {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const refreshOrders = useOrderStore(state => state.refreshOrders);
  const [phase, setPhase] = useState<"suggestion" | "reason">("suggestion");
  const [selectedReason, setSelectedReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!selectedReason) return;
    try {
      setCancelling(true);
      const session = useAuthStore.getState().session;
      const headers = {
        "Content-Type": "application/json",
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
      };

      // Step 1: Cancel the current order
      const cancelRes = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "CANCELLED", cancelReason: selectedReason }),
      });
      if (!cancelRes.ok) {
        const data = await cancelRes.json().catch(() => null);
        toast.error(data?.message || data?.error || "Could not cancel order.");
        return;
      }

      // Step 2: Replace cart with only the suggested dish
      await clearCart(true); // silent — no "cart cleared" toast
      await addItem({
        menuItemId: suggestion.dish.id,
        name: suggestion.dish.name,
        price: suggestion.dish.price,
        restaurantId: suggestion.restaurantId,
        restaurantName: suggestion.restaurantName,
        imageUrl: suggestion.dish.imageUrl,
      });

      // Step 3: Place new order automatically using same delivery details
      console.log("[AiSuggestionPopup] Placing new order with details:", {
        deliveryAddress: deliveryDetails.deliveryAddress,
        deliveryArea: deliveryDetails.deliveryArea,
        deliveryFee: deliveryDetails.deliveryFee,
        customerPhone: deliveryDetails.customerPhone,
        siteLocation: deliveryDetails.siteLocation,
        restaurantId: suggestion.restaurantId,
        dishId: suggestion.dish.id,
      });

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          deliveryAddress: deliveryDetails.deliveryAddress,
          deliveryArea: deliveryDetails.deliveryArea,
          deliveryFee: deliveryDetails.deliveryFee,
          deliveryFeesBreakdown: { [suggestion.restaurantId]: deliveryDetails.deliveryFee },
          distanceMiles: 0,
          customerPhone: deliveryDetails.customerPhone,
          siteLocation: deliveryDetails.siteLocation,
        }),
      });

      const orderData = await orderRes.json();
      console.log("[AiSuggestionPopup] New order response:", orderRes.status, orderData);
      if (!orderRes.ok) {
        toast.error(orderData?.error || orderData?.message || "Could not place new order.", { duration: 6000 });
        return;
      }

      // Step 4: Refresh store and redirect to new order's status page
      await refreshOrders();
      onCancelled();
      const newOrderId = orderData?.data?.orders?.[0]?.id;
      toast.success(`New order placed at ${suggestion.restaurantName}!`);
      router.push(newOrderId
        ? `/dashboard/customer/status/${newOrderId}`
        : `/dashboard/customer/orders`
      );
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    // Fixed bottom card — no backdrop, page stays interactive behind it
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* ── Phase 1: Suggestion ─────────────────────────────────────────── */}
        {phase === "suggestion" && (
          <div className="p-5">
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 leading-none mb-0.5">
                    Still waiting…
                  </p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">
                    Try a faster restaurant?
                  </p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors -mt-0.5 -mr-0.5"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* AI reason */}
            <p className="text-xs text-gray-500 font-medium mb-4 leading-relaxed">
              {suggestion.aiReason}
            </p>

            {/* Alternative dish card — horizontal layout */}
            <div className="flex gap-3 rounded-xl border border-gray-100 overflow-hidden mb-4 bg-gray-50/60">
              {/* Dish thumbnail */}
              <div className="w-20 h-20 shrink-0 bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={suggestion.dish.imageUrl}
                  alt={suggestion.dish.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 py-3 pr-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">
                  {suggestion.restaurantName}
                </p>
                <p className="text-sm font-black text-gray-900 leading-tight truncate">
                  {suggestion.dish.name}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-bold text-gray-700">
                    £{suggestion.dish.price.toFixed(2)}
                  </span>
                  {suggestion.avgAcceptanceMinutes > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" />
                      ~{suggestion.avgAcceptanceMinutes} min
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Keep Waiting
              </button>
              <button
                onClick={() => setPhase("reason")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gray-900 hover:bg-black transition-colors"
              >
                Try This
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 2: Cancel Reason ───────────────────────────────────────── */}
        {phase === "reason" && (
          <div className="p-5">
            <button
              onClick={() => setPhase("suggestion")}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go back
            </button>

            <h3 className="text-sm font-black text-gray-900 mb-1">Why are you cancelling?</h3>
            <p className="text-xs text-gray-400 font-medium mb-4">
              This helps us improve wait times for everyone.
            </p>

            <div className="space-y-2 mb-4">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason.key}
                  onClick={() => setSelectedReason(reason.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                    selectedReason === reason.key
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-100 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedReason === reason.key ? "border-white" : "border-gray-300"
                    }`}
                  >
                    {selectedReason === reason.key && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-sm font-semibold">{reason.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCancel}
              disabled={!selectedReason || cancelling}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {cancelling ? "Cancelling…" : "Cancel & Try Alternative"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
