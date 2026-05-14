import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic"; // Trigger re-compile

async function ensureKitchenStartsFromPaid(orderId: string) {
  await db
    .update(orders)
    .set({
      status: "PAID",
      updatedAt: new Date(),
    })
    .where(and(
      eq(orders.id, orderId),
      inArray(orders.status, [
        "PENDING_CONFIRMATION",
        "CONFIRMED",
        "DISPATCH_REQUESTED",
        "OUT_FOR_DELIVERY",
      ])
    ));
}

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

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    // 1. Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return fail("Payment not completed", 400);
    }

    // 2. Fetch the order to ensure it belongs to the user and needs updating
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.userId, user.id)),
    });

    if (!order) {
      return fail("Order not found.", 404);
    }

    // 3. Atomic Update: Only proceed if status is NOT already PAID
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "PAID",
        updatedAt: new Date()
      })
      .where(and(
        eq(orders.id, id),
        inArray(orders.status, ["PENDING_CONFIRMATION", "CONFIRMED"])
      ))
      .returning();

    if (updatedOrder) {
      // 4. Notify Restaurant Owner (same logic as webhook)
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

        // Dispatch Owner Notifications
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
            channels: ["FCM", "WHATSAPP", "EMAIL"] // PAID is a key stage for Email
          });
        }
      } catch (notifyErr) {
        console.error("[Stripe Verify] Failed to notify customer:", notifyErr);
      }

      // Create the Shipday order immediately after payment, but keep the app order
      // in kitchen-controlled states until the owner dispatches it manually.
      try {
        const { ShipdayService } = await import("@/services/shipday.service");
        await ShipdayService.triggerShipdayOrder(id, "DISPATCH_REQUESTED");
        await ensureKitchenStartsFromPaid(id);
        console.log(`[Stripe Verify] Shipday scheduled delivery created for order ${id}.`);
      } catch (shipdayErr) {
        console.error("[Stripe Verify] Failed to create Shipday scheduled delivery:", shipdayErr);
      }

      console.log(`[Stripe Verify] Verification complete for order ${id}.`);
    } else {
      console.log(`[Stripe Verify] Order ${id} was already marked as PAID.`);

      try {
        const { ShipdayService } = await import("@/services/shipday.service");
        await ShipdayService.triggerShipdayOrder(id, "DISPATCH_REQUESTED");
        await ensureKitchenStartsFromPaid(id);
        console.log(`[Stripe Verify] Shipday scheduled delivery ensured for already-paid order ${id}.`);
      } catch (shipdayErr) {
        console.error("[Stripe Verify] Failed to ensure Shipday scheduled delivery:", shipdayErr);
      }
    }

    return ok({ status: "PAID" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/orders/[id]/stripe/verify POST] ERROR:", message);
    return fail(`Verification Error: ${message}`, 500);
  }
}
