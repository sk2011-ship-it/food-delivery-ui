import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, deliveryJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { deleteShipdayOrder } from "@/lib/shipday";
import { NotificationService } from "@/services/notification.service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  return withAuth(req, async (user) => {
    try {
      // 1. Fetch order and verify ownership
      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          paymentIntentId: orders.paymentIntentId,
          paidAt: orders.paidAt,
          createdAt: orders.createdAt,
          restaurantId: orders.restaurantId,
          totalAmount: orders.totalAmount,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) return fail("Order not found", 404);
      if (order.userId !== user.id) return fail("Unauthorized", 403);

      // 2. Validate cancellation window (3 minutes = 180,000ms)
      if (order.status !== "PAID" && order.status !== "PREPARING") {
        return fail(`Order cannot be cancelled in its current state: ${order.status}`, 400);
      }

      // Use paidAt if available, otherwise fallback to createdAt for transitional orders
      const referenceTime = order.paidAt || order.createdAt;
      if (!referenceTime) {
        return fail("No valid timestamp found for this order.", 400);
      }

      const timeSincePayment = Date.now() - new Date(referenceTime).getTime();
      const THREE_MINUTES = 3 * 60 * 1000;

      if (timeSincePayment > THREE_MINUTES) {
        return fail("Cancellation window has expired (3 minutes limit).", 400);
      }

      // 3. Initiate Stripe Refund
      if (!order.paymentIntentId) {
        return fail("No payment intent found to refund.", 400);
      }

      let refundId: string | null = null;
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          reason: "requested_by_customer",
        });
        refundId = refund.id;
      } catch (stripeErr: any) {
        console.error("[Cancel API] Stripe refund failed:", stripeErr);
        const alreadyRefunded =
          typeof stripeErr?.message === "string" &&
          stripeErr.message.toLowerCase().includes("already been refunded");

        if (!alreadyRefunded) {
          return fail(`Refund failed: ${stripeErr.message}`, 500);
        }

        // The payment has already been refunded elsewhere, so we can still
        // mark the order as cancelled and keep the operation idempotent.
      }

      // 4. Update Database
      await db.transaction(async (tx) => {
        // Update Order Status
        await tx
          .update(orders)
          .set({
            status: "CANCELLED_BY_USER",
            refundId: refundId,
            refundStatus: "succeeded",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id));

        // Update Delivery Job if exists
        await tx
          .update(deliveryJobs)
          .set({
            status: "CANCELLED",
            updatedAt: new Date(),
          })
          .where(eq(deliveryJobs.orderId, id));
      });

      // 5. Cleanup External Services (Background)
      const cleanupTask = (async () => {
        try {
          // Cancel in Shipday if providerOrderId exists
          const [job] = await db
            .select({ providerOrderId: deliveryJobs.providerOrderId })
            .from(deliveryJobs)
            .where(eq(deliveryJobs.orderId, id))
            .limit(1);

          if (job?.providerOrderId && job.providerOrderId !== "LOCK") {
            await deleteShipdayOrder(job.providerOrderId);
          }

          // Notify Restaurant
          const [restaurant] = await db
            .select({ ownerId: restaurants.ownerId, name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, order.restaurantId))
            .limit(1);

          if (restaurant?.ownerId) {
            await NotificationService.dispatchOrderNotifications({
              userId: restaurant.ownerId,
              type: "ORDER",
              subject: "Order Cancelled (Refunded)",
              body: `Order #${id.slice(0, 8)} has been cancelled by the user within the 3-minute window. A full refund has been issued. Please do not prepare this order.`,
              metadata: { orderId: id, orderStatus: "CANCELLED_BY_USER" },
              channels: ["FCM", "WHATSAPP"]
            });
          }
        } catch (err) {
          console.error("[Cancel API] Background cleanup error:", err);
        }
      })();

      const waitUntil = (req as any).waitUntil;
      if (typeof waitUntil === "function") {
        waitUntil(cleanupTask);
      }

      return ok({ message: "Order cancelled and refund initiated successfully." });
    } catch (err) {
      console.error("[Cancel API] Error:", err);
      return fail("Internal server error", 500);
    }
  });
}
