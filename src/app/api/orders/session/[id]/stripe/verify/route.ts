import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderSessions, restaurants, users, notifications, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/session/[id]/stripe/verify
 * Verifies a Stripe Checkout Session for an Entire Order Session.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionId } = await req.json();

    if (!sessionId) return fail("Missing session_id", 400);

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    // 1. Retrieve the session from Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (stripeSession.payment_status !== "paid") {
      return fail("Payment not completed", 400);
    }

    // 2. Fetch the Order Session
    const [orderSession] = await db
      .select()
      .from(orderSessions)
      .where(and(eq(orderSessions.id, id), eq(orderSessions.userId, user.id)))
      .limit(1);

    if (!orderSession) return fail("Order session not found.", 404);

    // 3. Perform updates atomically if not already PAID
    await db.transaction(async (tx) => {
      const [updatedSession] = await tx
        .update(orderSessions)
        .set({ status: "PAID", updatedAt: new Date() })
        .where(and(eq(orderSessions.id, id), ne(orderSessions.status, "PAID")))
        .returning();

      if (!updatedSession) return;

      // Update all CONFIRMED orders in this session
      const updatedOrders = await tx
        .update(orders)
        .set({ status: "PAID", updatedAt: new Date() })
        .where(and(eq(orders.sessionId, id), eq(orders.status, "CONFIRMED")))
        .returning();

      // 4. Notifications for each updated order
      for (const order of updatedOrders) {
        try {
          const [restaurant] = await tx
            .select({ ownerId: restaurants.ownerId, name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, order.restaurantId))
            .limit(1);

          if (restaurant) {
            const subject = "Payment Received";
            
            const itemsRows = await tx
              .select({
                name: menuItems.name,
                quantity: orderItems.quantity,
              })
              .from(orderItems)
              .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
              .where(eq(orderItems.orderId, order.id));
            
            const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
            const ownerBody = `Payment Received! 💰\nOrder: #${order.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: PAID\n\nItems:\n${itemsSummary}\n\nTotal: £${order.totalAmount}`;

            // Dispatch Owner Notifications
            if (restaurant.ownerId) {
              await NotificationService.dispatchOrderNotifications({
                userId: restaurant.ownerId,
                type: "ORDER",
                subject,
                body: ownerBody,
                metadata: { orderId: order.id, orderStatus: "PAID", targetRole: "owner" },
                channels: ["FCM", "WHATSAPP"]
              });
            }
          }
        } catch (notifyErr) {
          console.error("Failed to notify restaurant:", notifyErr);
        }

        // Trigger Shipday for each order
        try {
          const { ShipdayService } = await import("@/services/shipday.service");
          await ShipdayService.triggerShipdayOrder(order.id);
        } catch (shipdayErr) {
          console.error(`Failed to trigger Shipday for order ${order.id}:`, shipdayErr);
        }
      }

      // 5. Notify Customer (once per session)
      try {
        const subject = "Payment Confirmed";
        const body = "Your payment was successful. The restaurants will start preparing your meal shortly.";

        // Dispatch Customer Notifications
        await NotificationService.dispatchOrderNotifications({
          userId: user.id,
          type: "ORDER",
          subject,
          body,
          metadata: { sessionId: id, orderStatus: "PAID", targetRole: "customer" },
          channels: ["FCM", "WHATSAPP", "EMAIL"] // PAID is a key stage for Email
        });
      } catch (notifyErr) {
        console.error("Failed to notify customer:", notifyErr);
      }
    });

    return ok({ status: "PAID" });
  } catch (err: any) {
    console.error("[api/orders/session/[id]/stripe/verify POST] ERROR:", err);
    return fail(`Verification Error: ${err.message || "Unknown error"}`, 500);
  }
}
