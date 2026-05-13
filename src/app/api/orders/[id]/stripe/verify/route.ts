import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

async function ensureKitchenStartsFromPaid(orderId: string) {
  await db
    .update(orders)
    .set({
      status: "PAID",
      updatedAt: new Date(),
      paidAt: new Date(),
    })
    .where(
      and(
        eq(orders.id, orderId),
        inArray(orders.status, [
          "PENDING_CONFIRMATION",
          "CONFIRMED",
          "DISPATCH_REQUESTED",
          "OUT_FOR_DELIVERY",
        ])
      )
    );
}

async function triggerSunmiPrint(orderId: string, baseUrl: string) {
  try {
    const res = await fetch(new URL("/api/sunmi/push", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    if (!res.ok) {
      console.error(`[Stripe Verify] Sunmi push failed for ${orderId}: ${await res.text()}`);
    }
  } catch (error) {
    console.error(`[Stripe Verify] Sunmi push error for ${orderId}:`, error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const baseUrl = new URL(req.url).origin;
    const { id } = await params;
    const { sessionId } = await req.json();

    if (!sessionId) return fail("Missing session_id", 400);

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return fail("Payment not completed", 400);
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.userId, user.id)),
    });
    if (!order) return fail("Order not found.", 404);

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "PAID",
        updatedAt: new Date(),
        paidAt: new Date(),
        paymentIntentId: session.payment_intent as string,
      })
      .where(eq(orders.id, id))
      .returning();

    const orderToUse = updatedOrder ?? order;

    const [restaurant] = await db
      .select({
        ownerId: restaurants.ownerId,
        name: restaurants.name,
      })
      .from(restaurants)
      .where(eq(restaurants.id, orderToUse.restaurantId))
      .limit(1);

    if (restaurant) {
      const itemsRows = await db
        .select({
          name: menuItems.name,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, orderToUse.id));

      const itemsSummary = itemsRows.map((i) => `${i.quantity}x ${i.name}`).join("\n");

      if (restaurant.ownerId) {
        await NotificationService.dispatchOrderNotifications({
          userId: restaurant.ownerId,
          type: "ORDER",
          subject: "Payment Received",
          body: `Payment Received! 💰\nOrder: #${orderToUse.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: PAID\n\nItems:\n${itemsSummary}\n\nTotal: £${orderToUse.totalAmount}`,
          metadata: {
            orderId: orderToUse.id,
            orderStatus: "PAID",
            targetRole: "owner",
            twilioContentSid: "HXd342e729a217385fbc2bc86c42e53801",
            twilioVariables: {
              "1": orderToUse.id.slice(0, 8).toUpperCase(),
              "2": restaurant.name,
              "3": itemsSummary,
              "4": `£${orderToUse.totalAmount}`,
            },
          },
          channels: ["FCM", "WHATSAPP"],
        });
      }

      if (orderToUse.userId) {
        await NotificationService.dispatchOrderNotifications({
          userId: orderToUse.userId,
          type: "ORDER",
          subject: "Payment Confirmed",
          body: "Your payment was successful. The restaurant will start preparing your meal shortly.",
          metadata: {
            orderId: orderToUse.id,
            orderStatus: "PAID",
            targetRole: "customer",
            twilioContentSid: "HX8fc09c456a92a49269c2ba5a93e8831e",
            twilioVariables: {
              "1": orderToUse.id.slice(0, 8).toUpperCase(),
              "2": restaurant.name,
              "3": "Payment Confirmed",
            },
          },
          channels: ["FCM", "WHATSAPP", "EMAIL"],
        });
      }
    }

    try {
      const { ShipdayService } = await import("@/services/shipday.service");
      await ShipdayService.triggerShipdayOrder(id, "DISPATCH_REQUESTED");
      await ensureKitchenStartsFromPaid(id);
      await triggerSunmiPrint(id, baseUrl);
    } catch (shipdayErr) {
      console.error("[Stripe Verify] Failed to create Shipday scheduled delivery:", shipdayErr);
    }

    return ok({ status: "PAID" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/orders/[id]/stripe/verify POST] ERROR:", message);
    return fail(`Verification Error: ${message}`, 500);
  }
}
