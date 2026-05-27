import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic"; // Trigger re-compile

/**
 * POST /api/orders/[id]/stripe/verify
 * Verifies a Stripe Checkout Session status and updates the order if paid.
 * This acts as a fallback for webhooks that might be missed in local dev.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionId } = await req.json();

    if (!sessionId) {
      return fail("Missing session_id", 400);
    }

    // Auth is optional — the stripeSessionId is secret enough to authorise the lookup
    const user = await getCurrentUser();

    // 1. Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return fail("Payment not completed", 400);
    }

    // 2. Fetch the order — prefer the route param, but fall back to Stripe metadata.
    const order = user
      ? await db.query.orders.findFirst({
          where: and(eq(orders.id, id), eq(orders.userId, user.id)),
        })
      : await db.query.orders.findFirst({
          where: eq(orders.id, id),
        });

    const resolvedOrderId = order?.id || (session.metadata?.orderId ?? null);
    if (!resolvedOrderId) {
      return fail("Order not found.", 404);
    }

    // 3. Atomic Update: Only proceed if status is NOT already PAID
    const verifyPaidAt = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "PAID",
        updatedAt: verifyPaidAt,
        paidAt: verifyPaidAt,
      })
      .where(and(
        eq(orders.id, resolvedOrderId),
        inArray(orders.status, ["PENDING_CONFIRMATION", "CONFIRMED"])
      ))
      .returning();

    if (updatedOrder) {
      // 4. Notify Restaurant Owner (same logic as webhook)
      try {
        const [restaurant] = await db
          .select({
            ownerId: restaurants.ownerId,
            name: restaurants.name
          })
          .from(restaurants)
          .where(eq(restaurants.id, updatedOrder.restaurantId))
          .limit(1);

        if (restaurant) {
          const subject = "Payment Received";

          const itemsRows = await db
            .select({
              name: menuItems.name,
              quantity: orderItems.quantity,
            })
            .from(orderItems)
            .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(eq(orderItems.orderId, updatedOrder.id));

          const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
          const ownerBody = `Payment Received! 💰\nOrder: #${updatedOrder.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: PAID\n\nItems:\n${itemsSummary}\n\nTotal: £${updatedOrder.totalAmount}`;

          if (restaurant.ownerId) {
            await NotificationService.dispatchOrderNotifications({
              userId: restaurant.ownerId,
              type: "ORDER",
              subject,
              body: ownerBody,
              metadata: { orderId: updatedOrder.id, orderStatus: "PAID", targetRole: "owner" },
              channels: ["FCM", "WHATSAPP"]
            });
          }
        }
      } catch (notifyOwnerErr) {
        console.error("[Stripe Verify] Failed to notify owner:", notifyOwnerErr);
      }

      // 5. Notify Customer
      try {
        const subject = "Payment Confirmed";
        const body = `Your payment was successful. The restaurant will start preparing your meal shortly.`;

        // Dispatch Customer Notifications
        if (updatedOrder.userId) {
          await NotificationService.dispatchOrderNotifications({
            userId: updatedOrder.userId,
            type: "ORDER",
            subject,
            body,
            metadata: { orderId: updatedOrder.id, orderStatus: "PAID", targetRole: "customer" },
            channels: ["FCM", "WHATSAPP"] // PAID is a key stage for Email
          });
        }
      } catch (notifyErr) {
        console.error("[Stripe Verify] Failed to notify customer:", notifyErr);
      }

      // Trigger Shipday — fallback for cases where the webhook was missed
      try {
        const { ShipdayService } = await import("@/services/shipday.service");
        await ShipdayService.triggerShipdayOrder(resolvedOrderId, "DISPATCH_REQUESTED");
        console.log(`[Stripe Verify] Shipday order created for ${resolvedOrderId}.`);
      } catch (shipdayErr) {
        console.error("[Stripe Verify] Failed to create Shipday order:", shipdayErr);
      }

      console.log(`[Stripe Verify] Verification complete for order ${resolvedOrderId}.`);
    } else {
      console.log(`[Stripe Verify] Order ${resolvedOrderId} was already marked as PAID.`);

      // Idempotent Shipday trigger — ShipdayService handles duplicate gracefully
      try {
        const { ShipdayService } = await import("@/services/shipday.service");
        await ShipdayService.triggerShipdayOrder(resolvedOrderId, "DISPATCH_REQUESTED");
        console.log(`[Stripe Verify] Shipday order ensured for already-paid order ${resolvedOrderId}.`);
      } catch (shipdayErr) {
        console.error("[Stripe Verify] Failed to ensure Shipday order:", shipdayErr);
      }
    }

    return ok({ status: "PAID" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/orders/[id]/stripe/verify POST] ERROR:", message);
    return fail(`Verification Error: ${message}`, 500);
  }
}
