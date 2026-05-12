import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";

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

async function triggerSunmiPrint(orderId: string, baseUrl: string) {
  try {
    await fetch(new URL("/api/sunmi/push", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch (error) {
    console.error("[Stripe Webhook] Sunmi push error:", error);
  }
}

export async function POST(req: Request) {
  const baseUrl = new URL(req.url).origin;
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

    if (orderId) {
      console.log(`[Stripe Webhook] Received completion for Order: ${orderId}`);

      try {
        // 1. Atomic Update: Only proceed if status is NOT already PAID
        const [updatedOrder] = await db
          .update(orders)
          .set({
            status: "PAID",
            updatedAt: new Date()
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
            await triggerSunmiPrint(orderId, baseUrl);
            console.log(`[Stripe Webhook] Shipday scheduled delivery ensured for already-paid order ${orderId}.`);
          } catch (shipdayErr) {
            console.error("[Stripe Webhook] Failed to ensure Shipday scheduled delivery:", shipdayErr);
          }
          return new NextResponse(null, { status: 200 });
        }

        if (updatedOrder) {
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
                    metadata: {
                      orderId: updatedOrder.id,
                      orderStatus: "PAID",
                      // Twilio verified template: new_order_owner_alert
                      twilioContentSid: "HXd342e729a217385fbc2bc86c42e53801",
                      twilioVariables: {
                        "1": updatedOrder.id.slice(0, 8).toUpperCase(),
                        "2": restaurant.name,
                        "3": itemsSummary,
                        "4": `£${updatedOrder.totalAmount}`,
                      },
                    },
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
                  metadata: {
                    orderId: updatedOrder.id,
                    orderStatus: "PAID",
                    targetRole: "customer",
                    // Twilio verified template: order_update_notification
                    twilioContentSid: "HX8fc09c456a92a49269c2ba5a93e8831e",
                    twilioVariables: {
                      "1": updatedOrder.id.slice(0, 8).toUpperCase(),
                      "2": restaurant?.name ?? "the restaurant",
                      "3": "Payment Confirmed",
                    },
                  },
                  channels: ["FCM", "WHATSAPP", "EMAIL"]
                });
              }

              // 5. Trigger Shipday
              const { ShipdayService } = await import("@/services/shipday.service");
              await ShipdayService.triggerShipdayOrder(updatedOrder.id, "DISPATCH_REQUESTED");
              await triggerSunmiPrint(updatedOrder.id, baseUrl);
              
            } catch (bgErr) {
              console.error("[Stripe Webhook] Background Task Error:", bgErr);
            }
          })();

          const waitUntil = (req as Request & { waitUntil?: (promise: Promise<unknown>) => void }).waitUntil;
          if (typeof waitUntil === "function") {
            waitUntil(backgroundTask);
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
