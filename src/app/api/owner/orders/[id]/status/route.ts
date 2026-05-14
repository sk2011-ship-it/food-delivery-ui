import { ok, fail, withOwnerAuth, parseBody } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems, notificationChannelEnum } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";
import { syncSessionStatus } from "@/lib/order-session";
import { z } from "zod";

const OwnerStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"])
});

// Human-readable labels for customer-facing notifications
const STATUS_LABELS: Record<string, { subject: string; body: (id: string, restaurant: string) => string }> = {
  PENDING_CONFIRMATION: { subject: "Order Received", body: (id, r) => `Your order #${id} from ${r} has been received and is pending confirmation.` },
  PAID: { subject: "Payment Confirmed", body: (id, r) => `Your payment for order #${id} at ${r} was successful. The restaurant will start preparing it soon.` },
  CONFIRMED: { subject: "Order Confirmed", body: (id, r) => `Restaurant confirmed your order #${id} at ${r}. It's now in the kitchen!` },
  PREPARING: { subject: "Kitchen is Cooking", body: (id, r) => `Your order #${id} at ${r} is in the kitchen and being prepared.` },
  DISPATCH_REQUESTED: { subject: "Order Dispatched", body: (id, r) => `Your order #${id} from ${r} is now dispatched!` },
  OUT_FOR_DELIVERY: { subject: "On the Way", body: (id, r) => `Your order #${id} from ${r} is now out for delivery.` },
  DELIVERED: { subject: "Delivered", body: (id, r) => `Congratulations! Your order #${id} from ${r} is successfully delivered. Enjoy!` },
  CANCELLED: { subject: "Order Cancelled", body: (id, r) => `Your order #${id} from ${r} has been cancelled.` },
};

const OWNER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  DISPATCH_REQUESTED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * PATCH /api/owner/orders/[id]/status
 * Updates the order status, but ONLY if the restaurant belongs to the current user.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOwnerAuth(req, async (user) => {
    console.log(`[PATCH /api/owner/orders/status] Start. User: ${user.email}`);
    try {
      const { id } = await params;
      const body = await parseBody(req, OwnerStatusSchema);
      if ("error" in body) return body.error;
      const { status } = body.data;

      console.log(`[api/owner/orders/status] Received status: "${status}" for order: ${id}`);

      // 1. Ownership Validation: 
      const [ownedOrder] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          totalAmount: orders.totalAmount,
          status: orders.status
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(and(
          eq(orders.id, id),
          eq(restaurants.ownerId, user.id)
        ))
        .limit(1);

      if (!ownedOrder) {
        return fail("Order not found or you don't have permission to manage it.", 403);
      }

      const nextStatus = status;
      const allowedNextStatuses = OWNER_ALLOWED_TRANSITIONS[ownedOrder.status] ?? [];

      if (!allowedNextStatuses.includes(nextStatus)) {
        return fail(`Cannot change order from ${ownedOrder.status} to ${nextStatus}.`, 409);
      }

      const [updated] = await db
        .update(orders)
        .set({
          status: nextStatus,
          updatedAt: new Date()
        })
        .where(and(
          eq(orders.id, id),
          eq(orders.status, ownedOrder.status)
        ))
        .returning();

      if (!updated) {
        return fail("Order status has changed or order not found. Please refresh and try again.", 409);
      }

      // 3. Fire-and-forget BACKGROUND tasks
      void (async () => {
        // A. Sync Session Status
        try {
          if (updated.sessionId && (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED")) {
            await syncSessionStatus(updated.sessionId);
          }
        } catch (syncErr) {
          console.error("[owner/orders/status] syncSessionStatus failed:", syncErr);
        }

        // B. Handle Shipday for Dispatch
        try {
          if (nextStatus === "OUT_FOR_DELIVERY") {
            const { ShipdayService } = await import("@/services/shipday.service");
            await ShipdayService.triggerShipdayOrder(id, "OUT_FOR_DELIVERY");
          } else if (nextStatus === "DELIVERED" || nextStatus === "CANCELLED") {
            const { ShipdayService } = await import("@/services/shipday.service");
            await ShipdayService.updateDeliveryStatus(id, nextStatus);
          }
        } catch (shipdayErr) {
          console.error("[owner/orders/status] Shipday integration failed:", shipdayErr);
        }

        // 2. Fetch Restaurant Info for notifications
        let restaurantName = "restaurant";
        try {
          const [restaurantInfo] = await db
            .select({ name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, ownedOrder.restaurantId))
            .limit(1);
          if (restaurantInfo) restaurantName = restaurantInfo.name;
        } catch (dbErr) {
          console.error("[owner/orders/status] Failed to fetch restaurant name for notifications:", dbErr);
        }

        // C. Notify the customer
        try {
          if (ownedOrder.userId) {
            const label = STATUS_LABELS[nextStatus] || {
              subject: "Order Update",
              body: (id: string, r: string) => `Your order #${id} from ${r} is now ${nextStatus.toLowerCase().replace(/_/g, " ")}.`
            };

            const subject = label.subject;
            const body = label.body(id.slice(0, 8), restaurantName);

            const customerChannels: (typeof notificationChannelEnum)[number][] = ["FCM", "WHATSAPP"];

            await NotificationService.dispatchOrderNotifications({
              userId: ownedOrder.userId,
              type: "ORDER",
              subject,
              body,
              metadata: { orderId: id, orderStatus: nextStatus, targetRole: "customer" },
              channels: customerChannels
            });
          }
        } catch (notifyCustomerErr) {
          console.error("[owner/orders/status] Failed to notify customer:", notifyCustomerErr);
        }

        // D. Notify the owner
        try {
          const statusText = nextStatus.replace(/_/g, " ").toLowerCase();
          const subject = `Order Update: #${id.slice(0, 8)}`;

          const itemsRows = await db
            .select({
              name: menuItems.name,
              quantity: orderItems.quantity,
            })
            .from(orderItems)
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(eq(orderItems.orderId, id));

          const totalAmount = ownedOrder.totalAmount || "0.00";
          const itemsSummary = itemsRows.length > 0
            ? itemsRows.map(i => `${i.quantity}x ${i.name || "Unknown Item"}`).join("\n")
            : "No specific items found for this order.";

          const detailedBody = `*Order Update: #${id.slice(0, 8)}*\nRestaurant: ${restaurantName}\nStatus: ${statusText.toUpperCase()}\n\n*Items:*\n${itemsSummary}\n\n*Total:* £${totalAmount}`;

          await NotificationService.dispatchOrderNotifications({
            userId: user.id,
            type: "ORDER",
            subject,
            body: detailedBody,
            metadata: { orderId: id, orderStatus: nextStatus, targetRole: "owner" },
            channels: ["FCM", "WHATSAPP"]
          });
        } catch (notifyOwnerErr) {
          console.error("[owner/orders/status] Failed to notify owner:", notifyOwnerErr);
        }
      })();

      // 4. Respond to owner IMMEDIATELY after DB status update
      return ok({ order: updated });
    } catch (err) {
      console.error("[api/owner/orders/[id]/status PATCH]", err);
      return fail("Failed to update status by owner.", 500);
    }
  });
}
