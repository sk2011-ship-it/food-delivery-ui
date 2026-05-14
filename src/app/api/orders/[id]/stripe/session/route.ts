import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { trackOrderMetric } from "@/lib/metrics";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/stripe/session
 * Creates a Stripe Checkout Session for an existing order that is CONFIRMED.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;

      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, id), eq(orders.userId, user.id)),
        with: {
          restaurant: true,
          items: {
            with: {
              menuItem: true,
            },
          },
        },
      });

      if (!order) {
        return fail("Order not found.", 404);
      }

      const host = (await headers()).get("host");
      const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;

      // Map order items to Stripe line items
      const lineItems = order.items.map((item) => {
        const name = item.menuItem?.name || "Food Item";
        const unitAmount = Math.round(parseFloat(item.price as string) * 100);
        
        return {
          price_data: {
            currency: (order.currency || "GBP").toLowerCase(),
            product_data: {
              name,
              description: `Order #${order.id.slice(0, 8)}`,
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        };
      });

      // Add delivery fee line item
      const chargeDeliveryOnline = order.restaurant?.location === "Kilkeel" || order.restaurant?.location === "Downpatrick";
      if (chargeDeliveryOnline && parseFloat(order.deliveryFee as string) > 0) {
        lineItems.push({
          price_data: {
            currency: (order.currency || "GBP").toLowerCase(),
            product_data: {
              name: "Delivery Fee",
              description: "Restaurant delivery charge",
            },
            unit_amount: Math.round(parseFloat(order.deliveryFee as string) * 100),
          },
          quantity: 1,
        } as any);
      }

      // Add service charge line item
      if (parseFloat(order.serviceCharge as string) > 0) {
        lineItems.push({
          price_data: {
            currency: (order.currency || "GBP").toLowerCase(),
            product_data: {
              name: "Service Charge",
              description: "Platform service fee",
            },
            unit_amount: Math.round(parseFloat(order.serviceCharge as string) * 100),
          },
          quantity: 1,
        } as any);
      }


      // Create the session with a reasonable timeout (10 seconds)
      const sessionPromise = stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${baseUrl}/checkout/cancel?order_id=${order.id}`,
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
      });

      // Race against a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Stripe API Timeout")), 15000)
      );

      const session = await Promise.race([sessionPromise, timeoutPromise]) as any;

      console.log("Stripe session created successfully:", session.id);
      void trackOrderMetric(id, { paymentInitiatedAt: new Date() });
      return ok({ url: session.url });
    } catch (err: any) {
      console.error("[api/orders/[id]/stripe/session POST] ERROR DETAIL:", err.message || err);
      return fail(`Stripe Error: ${err.message || "Unknown error"}`, 500);
    }
  });
}
