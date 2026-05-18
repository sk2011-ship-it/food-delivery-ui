import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems, orderSessions } from "@/lib/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { trackOrderMetric } from "@/lib/metrics";

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
      ])
    ));
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event;

  try {
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse("Missing Stripe signature or webhook secret", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown webhook error";
    console.error(`[Stripe Webhook] Error: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const orderSessionId = session.metadata?.orderSessionId;

    // --- Multi-restaurant session payment ---
    if (orderSessionId) {
      console.log(`[Stripe Webhook] Received completion for OrderSession: ${orderSessionId}`);

      try {
        // BUG-004: Idempotency guard — skip if already PAID
        const [existingSession] = await db
          .select({ id: orderSessions.id, status: orderSessions.status, userId: orderSessions.userId })
          .from(orderSessions)
          .where(eq(orderSessions.id, orderSessionId))
          .limit(1);

        if (!existingSession) {
          console.log(`[Stripe Webhook] OrderSession ${orderSessionId} not found.`);
          return new NextResponse(null, { status: 200 });
        }

        if (existingSession.status === "PAID") {
          console.log(`[Stripe Webhook] OrderSession ${orderSessionId} already PAID. Skipping.`);
          return new NextResponse(null, { status: 200 });
        }

        // Update session to PAID
        const [updatedSession] = await db
          .update(orderSessions)
          .set({ status: "PAID", updatedAt: new Date() })
          .where(and(eq(orderSessions.id, orderSessionId), ne(orderSessions.status, "PAID")))
          .returning();

        if (!updatedSession) {
          console.log(`[Stripe Webhook] OrderSession ${orderSessionId} already PAID (race condition).`);
          return new NextResponse(null, { status: 200 });
        }

        // Update all CONFIRMED sub-orders to PAID
        const paidAt = new Date();
        const updatedOrders = await db
          .update(orders)
          .set({ status: "PAID", updatedAt: paidAt, paidAt })
          .where(and(eq(orders.sessionId, orderSessionId), eq(orders.status, "CONFIRMED")))
          .returning();

        // Track paidAt for every sub-order
        void Promise.all(updatedOrders.map(o => trackOrderMetric(o.id, { paidAt })));

        // Background notifications and Shipday
        const backgroundTask = (async () => {
          try {
            // Notify each restaurant owner
            for (const order of updatedOrders) {
              try {
                const [restaurant] = await db
                  .select({ ownerId: restaurants.ownerId, name: restaurants.name })
                  .from(restaurants)
                  .where(eq(restaurants.id, order.restaurantId))
                  .limit(1);

                if (restaurant?.ownerId) {
                  const itemsRows = await db
                    .select({ name: menuItems.name, quantity: orderItems.quantity })
                    .from(orderItems)
                    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
                    .where(eq(orderItems.orderId, order.id));

                  const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
                  const ownerBody = `Payment Confirmed! 💰\nOrder: #${order.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: PAID\n\nItems:\n${itemsSummary}\n\nTotal: £${order.totalAmount}`;

                  await NotificationService.dispatchOrderNotifications({
                    userId: restaurant.ownerId,
                    type: "ORDER",
                    subject: "Payment Received",
                    body: ownerBody,
                    metadata: { orderId: order.id, orderStatus: "PAID", targetRole: "owner" },
                    channels: ["FCM", "WHATSAPP"],
                  });
                }

                // Trigger Shipday for each sub-order
                const { ShipdayService } = await import("@/services/shipday.service");
                await ShipdayService.triggerShipdayOrder(order.id, "DISPATCH_REQUESTED");
              } catch (subErr) {
                console.error(`[Stripe Webhook] Error processing sub-order ${order.id}:`, subErr);
              }
            }

            // Notify customer once for the whole session
            if (existingSession.userId) {
              await NotificationService.dispatchOrderNotifications({
                userId: existingSession.userId,
                type: "ORDER",
                subject: "Payment Confirmed",
                body: "Your payment was successful. The restaurants will start preparing your meals shortly.",
                metadata: { sessionId: orderSessionId, orderStatus: "PAID", targetRole: "customer" },
                channels: ["FCM", "WHATSAPP", "EMAIL"],
              });
            }
          } catch (bgErr) {
            console.error("[Stripe Webhook] Session Background Task Error:", bgErr);
          }
        })();

        if (typeof (req as any).waitUntil === "function") {
          (req as any).waitUntil(backgroundTask);
        }
      } catch (dbErr) {
        console.error("[Stripe Webhook] Database Error (session):", dbErr);
        return new NextResponse("Internal Server Error during session update", { status: 500 });
      }
    }

    // --- Single-order payment ---
    if (orderId) {
      console.log(`[Stripe Webhook] Received completion for Order: ${orderId}`);

      try {
        // 1. Atomic Update: Only proceed if status is NOT already PAID
        const singlePaidAt = new Date();
        const [updatedOrder] = await db
          .update(orders)
          .set({
            status: "PAID",
            updatedAt: singlePaidAt,
            paidAt: singlePaidAt,
          })
          .where(and(
            eq(orders.id, orderId),
            inArray(orders.status, ["PENDING_CONFIRMATION", "CONFIRMED"])
          ))
          .returning();

        if (!updatedOrder) {
          console.log(`[Stripe Webhook] Order ${orderId} already PAID or not found.`);
          try {
            const { ShipdayService } = await import("@/services/shipday.service");
            await ShipdayService.triggerShipdayOrder(orderId, "DISPATCH_REQUESTED");
            await ensureKitchenStartsFromPaid(orderId);
            console.log(`[Stripe Webhook] Shipday scheduled delivery ensured for already-paid order ${orderId}.`);
          } catch (shipdayErr) {
            console.error("[Stripe Webhook] Failed to ensure Shipday scheduled delivery:", shipdayErr);
          }
          return new NextResponse(null, { status: 200 });
        }

        if (updatedOrder) {
          void trackOrderMetric(orderId, { paidAt: singlePaidAt });

          // Offload notifications and external services to the background
          const backgroundTask = (async () => {
            try {
              // 3. Notify Restaurant Owner
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
                const ownerBody = `Payment Confirmed! 💰\nOrder: #${updatedOrder.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: PAID\n\nItems:\n${itemsSummary}\n\nTotal: £${updatedOrder.totalAmount}`;

                if (restaurant.ownerId) {
                  await NotificationService.dispatchOrderNotifications({
                    userId: restaurant.ownerId,
                    type: "ORDER",
                    subject,
                    body: ownerBody,
                    metadata: { orderId: updatedOrder.id, orderStatus: "PAID" },
                    channels: ["FCM", "WHATSAPP"]
                  });
                }
              }

              // 4. Notify Customer
              if (updatedOrder.userId) {
                await NotificationService.dispatchOrderNotifications({
                  userId: updatedOrder.userId,
                  type: "ORDER",
                  subject: "Payment Confirmed",
                  body: `Your payment was successful. The restaurant will start preparing your meal shortly.`,
                  metadata: { orderId: updatedOrder.id, orderStatus: "PAID", targetRole: "customer" },
                  channels: ["FCM", "WHATSAPP", "EMAIL"]
                });
              }

              // 5. Trigger Shipday
              const { ShipdayService } = await import("@/services/shipday.service");
              await ShipdayService.triggerShipdayOrder(updatedOrder.id, "DISPATCH_REQUESTED");

            } catch (bgErr) {
              console.error("[Stripe Webhook] Background Task Error:", bgErr);
            }
          })();

          if (typeof (req as any).waitUntil === "function") {
            (req as any).waitUntil(backgroundTask);
          }
        }
      } catch (dbErr) {
        console.error("[Stripe Webhook] Database Error:", dbErr);
        return new NextResponse("Internal Server Error during order update", { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
