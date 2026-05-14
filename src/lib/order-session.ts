import { db } from "./db";
import { orders, orderSessions } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

/**
 * syncSessionStatus - Aggregates sub-order statuses and updates the parent session.
 * 
 * Logic:
 * 1. Fetch all sibling orders in the session.
 * 2. If ALL have responded (status != PENDING_CONFIRMATION):
 *    - Calculate total amount of ACCEPTED items.
 *    - Calculate total delivery fee of ACCEPTED restaurants.
 *    - Update session status to READY_TO_PAY (if any accepted) or CANCELLED (if all rejected).
 */
export async function syncSessionStatus(sessionId: string) {
  try {
    // Fetch session and sibling orders together
    const [session] = await db
      .select()
      .from(orderSessions)
      .where(eq(orderSessions.id, sessionId))
      .limit(1);

    if (!session) return;

    // BUG-010: Never overwrite a PAID session — payment is final
    if (session.status === "PAID") {
      console.log(`[SessionSync] Session ${sessionId} is already PAID, skipping sync.`);
      return;
    }

    const siblingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, sessionId));

    if (siblingOrders.length === 0) return;

    // Check if everyone has responded (no longer PENDING_CONFIRMATION)
    const allResponded = siblingOrders.every(o =>
      o.status !== "PENDING_CONFIRMATION"
    );

    if (!allResponded) {
      console.log(`[SessionSync] Session ${sessionId} still waiting for responses.`);
      return;
    }

    // BUG-007: Only sum fees from non-cancelled orders (already correct — acceptedOrders excludes CANCELLED)
    const acceptedOrders = siblingOrders.filter(o =>
      !["CANCELLED", "PENDING_CONFIRMATION"].includes(o.status)
    );

    const totalItems = acceptedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const totalDelivery = acceptedOrders.reduce((sum, o) => sum + parseFloat(o.deliveryFee), 0);
    const totalMiles = acceptedOrders.reduce((sum, o) => sum + (o.distanceMiles ? parseFloat(o.distanceMiles as string) : 0), 0);

    // BUG-010: If all non-PENDING orders are CANCELLED (including those previously CONFIRMED), set CANCELLED
    let sessionStatus: "READY_TO_PAY" | "CANCELLED" = acceptedOrders.length === 0
      ? "CANCELLED"
      : "READY_TO_PAY";

    console.log(`[SessionSync] Session ${sessionId} aggregation complete. Status: ${sessionStatus}, Total: £${(totalItems + totalDelivery).toFixed(2)}`);

    await db.update(orderSessions)
      .set({
        status: sessionStatus,
        totalItemsAmount: totalItems.toFixed(2),
        totalDeliveryFee: totalDelivery.toFixed(2),
        distanceMiles: totalMiles > 0 ? totalMiles.toFixed(4) : null,
        updatedAt: new Date()
      })
      .where(eq(orderSessions.id, sessionId));

    // BUG-006: Send FCM push notification to customer when session is ready to pay
    if (sessionStatus === "READY_TO_PAY" && session.userId) {
      try {
        await NotificationService.dispatchOrderNotifications({
          userId: session.userId,
          type: "ORDER",
          subject: "Ready to Pay",
          body: "All restaurants confirmed your order — tap to pay.",
          metadata: { sessionId, orderStatus: "READY_TO_PAY", targetRole: "customer" },
          channels: ["FCM"],
        });
      } catch (notifyErr) {
        console.error(`[SessionSync] Failed to send READY_TO_PAY notification for session ${sessionId}:`, notifyErr);
      }
    }

  } catch (error) {
    console.error(`[SessionSync] Error syncing session ${sessionId}:`, error);
  }
}
