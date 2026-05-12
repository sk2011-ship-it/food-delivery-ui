import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems, notificationChannelEnum } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { syncSessionStatus } from "@/lib/order-session";
import { NotificationService } from "@/services/notification.service";

const ORDER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "PAID", "CANCELLED"],
  CONFIRMED: ["PAID", "CANCELLED"],
  PAID: ["PREPARING"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  DISPATCH_REQUESTED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const StatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PAID",
    "PREPARING",
    "DISPATCH_REQUESTED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED"
  ]),
  paymentIntentId: z.string().optional(),
});

/**
 * PATCH /api/orders/[id]/status
 * Updates the status of an order.
 * - Customer can update to PAID (providing paymentIntentId).
 * - Restaurant owner can update to other states.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;
      const body = await parseBody(req, StatusSchema);
      if ("error" in body) return body.error;
      const { status, paymentIntentId } = body.data;

      // 1. Fetch the order
      const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) return fail("Order not found", 404);

      // If status is already what we want, just return OK (idempotency)
      if (order.status === status) {
        return ok({ order });
      }

      const allowedTransitions = ORDER_ALLOWED_TRANSITIONS[order.status] ?? [];

      // 2. Permission Check: 
      if (status === "PAID") {
        // Only admins can mark orders as PAID (for manual confirmation)
        // Customers must pay via Stripe, which updates status via webhook
        if (user.role !== "admin") {
          return fail("You don't have permission to mark this order as paid manually.", 403);
        }
        if (!allowedTransitions.includes("PAID")) {
          return fail(`Cannot change order from ${order.status} to PAID.`, 409);
        }
      } else if (status === "CANCELLED") {
        // Both customer and restaurant owner can cancel
        const isCustomerOwner = order.userId === user.id;

        // Owner check
        let isRestoOwner = false;
        if (user.role !== "customer") {
          const [ownedResto] = await db
            .select({ id: restaurants.id })
            .from(restaurants)
            .where(and(
              eq(restaurants.id, order.restaurantId),
              eq(restaurants.ownerId, user.id)
            ))
            .limit(1);
          isRestoOwner = !!ownedResto;
        }

        // If customer is cancelling, ensure it's THEIR order and it's still in a cancellable state
        if (isCustomerOwner && user.role === "customer") {
          const cancellableStatuses = ["PENDING_CONFIRMATION", "CONFIRMED", "CANCELLED"];
          if (!cancellableStatuses.includes(order.status)) {
            return fail("You cannot cancel an order that is already being prepared or delivered.", 403);
          }
        }

        if (!isCustomerOwner && !isRestoOwner && user.role !== "admin") {
          return fail("Forbidden. You don't have permission to cancel this order.", 403);
        }

        if (!allowedTransitions.includes("CANCELLED")) {
          return fail(`Cannot cancel an order in status ${order.status}.`, 409);
        }
      } else {
        // Manager status: CONFIRMED, PREPARING, etc.
        // Requires OWNER or ADMIN role and ownership of the restaurant
        if (user.role === "customer") {
          return fail("Unauthorized. Only restaurant owners or admins can update kitchen status.", 403);
        }

        const [ownedResto] = await db
          .select({ id: restaurants.id })
          .from(restaurants)
          .where(and(
            eq(restaurants.id, order.restaurantId),
            eq(restaurants.ownerId, user.id)
          ))
          .limit(1);

        if (!ownedResto && user.role !== "admin") {
          return fail("Forbidden. You don't own the restaurant associated with this order.", 403);
        }

        // Hard Block: Only owner/admin can set to OUT_FOR_DELIVERY
        if (status === "OUT_FOR_DELIVERY" && user.role !== "owner" && user.role !== "admin") {
           return fail("Only restaurant owners can dispatch orders.", 403);
        }

        if (!allowedTransitions.includes(status)) {
          return fail(`Cannot change order from ${order.status} to ${status}.`, 409);
        }
      }

      // 3. Update the status
      const updateData: any = {
        status,
        updatedAt: new Date(),
        ...(paymentIntentId && { paymentIntentId })
      };

      const [updated] = await db
        .update(orders)
        .set(updateData)
        .where(
          and(
            eq(orders.id, id),
            eq(orders.status, order.status) // Optimistic Locking
          )
        )
        .returning();

      if (!updated) {
        return fail("Conflict: Order status was changed recently. Please refresh and try again.", 409);
      }

      // 4. Session Status Aggregation (Post-update)
      if (updated.sessionId && ["CONFIRMED", "CANCELLED", "PAID"].includes(status)) {
        await syncSessionStatus(updated.sessionId);
      }

      // --- Notify Owner ---
      try {
        const [resto] = await db
          .select({
            name: restaurants.name,
            ownerId: restaurants.ownerId,
          })
          .from(restaurants)
          .where(eq(restaurants.id, order.restaurantId))
          .limit(1);

        if (resto) {
          const statusText = status.replace(/_/g, " ").toLowerCase();
          const subject = status === "PAID" ? "Payment Confirmed" : `Order Update: #${id.slice(0, 8)}`;
          
          const itemsRows = await db
            .select({
              name: menuItems.name,
              quantity: orderItems.quantity,
            })
            .from(orderItems)
            .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(eq(orderItems.orderId, id));
          
          const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
          const ownerBody = `Order Update: #${id.slice(0, 8)}\nRestaurant: ${resto.name}\nStatus: ${statusText.toUpperCase()}\n\nItems:\n${itemsSummary}\n\nTotal: £${order.totalAmount}`;

          // Dispatch Owner Notifications
          if (resto.ownerId) {
            await NotificationService.dispatchOrderNotifications({
              userId: resto.ownerId,
              type: "ORDER",
              subject,
              body: ownerBody,
              metadata: {
                orderId: id,
                orderStatus: status,
                // Twilio verified template: new_order_owner_alert
                twilioContentSid: "HXd342e729a217385fbc2bc86c42e53801",
                twilioVariables: {
                  "1": id.slice(0, 8).toUpperCase(),
                  "2": resto.name,
                  "3": itemsSummary,
                  "4": `£${order.totalAmount}`,
                },
              },
              channels: ["FCM", "WHATSAPP"]
            });
          }

          const customerBody = `Your order #${id.slice(0, 8)} from ${resto.name} is now ${statusText.toUpperCase()}.`;

          // Dispatch Customer Notifications
          if (order.userId) {
            const customerChannels: (typeof notificationChannelEnum)[number][] = ["FCM", "WHATSAPP"];
            if (status === "PAID") {
              customerChannels.push("EMAIL");
            }

            await NotificationService.dispatchOrderNotifications({
              userId: order.userId,
              type: "ORDER",
              subject,
              body: customerBody,
              metadata: {
                orderId: id,
                orderStatus: status,
                // Twilio verified template: order_update_notification
                twilioContentSid: "HX8fc09c456a92a49269c2ba5a93e8831e",
                twilioVariables: {
                  "1": id.slice(0, 8).toUpperCase(),
                  "2": resto.name,
                  "3": subject,
                },
              },
              channels: customerChannels
            });
          }
        }
      } catch (notifyErr) {
        console.error("[api/orders/status] Failed to notify owner:", notifyErr);
      }

      return ok({ order: updated });
    } catch (err) {
      console.error("[api/orders/[id]/status PATCH]", err);
      return fail("Failed to update order status.", 500);
    }
  });
}
