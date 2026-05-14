import { ok, fail, withAuth } from "@/lib/proxy";
import { trackOrderMetric } from "@/lib/metrics";
import { db } from "@/lib/db";
import { orderSessions, orders, orderItems, menuItems, restaurants } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/session/[id]/stripe/session
 * Creates a Stripe Checkout Session for an entire order session.
 * Only confirmed sub-orders are included in the total.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;

      // 1. Fetch Session
      const [session] = await db
        .select()
        .from(orderSessions)
        .where(and(eq(orderSessions.id, id), eq(orderSessions.userId, user.id)))
        .limit(1);

      if (!session) return fail("Session not found.", 404);
      if (session.status !== "READY_TO_PAY") {
        return fail(`Session is not ready for payment. Status: ${session.status}`, 400);
      }

      // 2. Fetch all CONFIRMED orders in this session
      const confirmedOrders = await db
        .select({
          id: orders.id,
          deliveryFee: orders.deliveryFee,
          serviceCharge: orders.serviceCharge,
          restaurantLocation: restaurants.location,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(and(eq(orders.sessionId, id), eq(orders.status, "CONFIRMED")));

      if (confirmedOrders.length === 0) {
        return fail("No confirmed orders found in this session to pay for.", 400);
      }

      // 3. Fetch all items for these orders
      const orderIds = confirmedOrders.map(o => o.id);
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          price: orderItems.price,
          name: menuItems.name,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(inArray(orderItems.orderId, orderIds));

      const host = (await headers()).get("host");
      const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;

      // 4. Map items to Stripe line items
      const lineItems = items.map((item) => ({
        price_data: {
          currency: (session.currency || "GBP").toLowerCase(),
          product_data: {
            name: item.name,
            description: "Part of multi-restaurant order",
          },
          unit_amount: Math.round(parseFloat(item.price as string) * 100),
        },
        quantity: item.quantity,
      }));

      // 5. Add delivery fee and service charge line items
      const totalDeliveryFee = confirmedOrders.reduce((sum, o) => {
        if (o.restaurantLocation !== "Kilkeel" && o.restaurantLocation !== "Downpatrick") return sum;
        return sum + parseFloat(o.deliveryFee);
      }, 0);
      if (totalDeliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: (session.currency || "GBP").toLowerCase(),
            product_data: {
              name: "Delivery Fee",
              description: `Combined fee for ${confirmedOrders.length} restaurant(s)`,
            },
            unit_amount: Math.round(totalDeliveryFee * 100),
          },
          quantity: 1,
        } as any);
      }

      const totalServiceCharge = confirmedOrders.reduce((sum, o) => sum + parseFloat(o.serviceCharge), 0);
      if (totalServiceCharge > 0) {
        lineItems.push({
          price_data: {
            currency: (session.currency || "GBP").toLowerCase(),
            product_data: {
              name: "Service Charge",
              description: "Platform service fee",
            },
            unit_amount: Math.round(totalServiceCharge * 100),
          },
          quantity: 1,
        } as any);
      }


      // 6. Create Stripe Session
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${baseUrl}/checkout/success-session?session_id={CHECKOUT_SESSION_ID}&order_session_id=${session.id}`,
        cancel_url: `${baseUrl}/dashboard/customer/orders`,
        metadata: {
          orderSessionId: session.id,
          userId: user.id,
          isSession: "true"
        },
      });

      // Track paymentInitiatedAt for all confirmed sub-orders in this session
      void Promise.all(
        confirmedOrders.map(o => trackOrderMetric(o.id, { paymentInitiatedAt: new Date() }))
      );

      return ok({ url: stripeSession.url });
    } catch (err: any) {
      console.error("[api/orders/session/[id]/stripe/session POST] ERROR:", err);
      return fail(`Stripe Error: ${err.message || "Unknown error"}`, 500);
    }
  });
}
