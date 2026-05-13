import { db } from "./db";
import { orders, restaurants, orderSessions } from "./db/schema";
import { eq, lt, and, desc } from "drizzle-orm";
import { syncSessionStatus } from "./order-session";
import { NotificationService } from "@/services/notification.service";

const EXPIRY_MS = 5 * 60 * 1000;

export type ExpiredOrderResult = {
  orderId: string;
  sessionId: string | null;
};

export async function cancelExpiredPendingOrders(now = new Date()): Promise<ExpiredOrderResult[]> {
  const cutoff = new Date(now.getTime() - EXPIRY_MS);

  const expiredOrders = await db
    .select({
      id: orders.id,
      sessionId: orders.sessionId,
      userId: orders.userId,
      restaurantId: orders.restaurantId,
      createdAt: orders.createdAt,
      restaurantName: restaurants.name,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(and(
      eq(orders.status, "PENDING_CONFIRMATION"),
      lt(orders.createdAt, cutoff)
    ))
    .orderBy(desc(orders.createdAt));

  const results: ExpiredOrderResult[] = [];

  for (const order of expiredOrders) {
    const [updated] = await db
      .update(orders)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(and(
        eq(orders.id, order.id),
        eq(orders.status, "PENDING_CONFIRMATION")
      ))
      .returning();

    if (!updated) continue;

    results.push({ orderId: updated.id, sessionId: updated.sessionId });

    try {
      if (updated.sessionId) {
        await syncSessionStatus(updated.sessionId);
      }
    } catch (err) {
      console.error(`[order-expiration] Failed to sync session ${updated.sessionId}:`, err);
    }

    try {
      if (order.restaurantName) {
        const customerBody = `Your order #${updated.id.slice(0, 8)} from ${order.restaurantName} expired because it was not confirmed in time.`;
        const ownerBody = `Order #${updated.id.slice(0, 8)} from ${order.restaurantName} expired after 5 minutes without confirmation.`;

        if (updated.userId) {
          await NotificationService.dispatchOrderNotifications({
            userId: updated.userId,
            type: "ORDER",
            subject: "Order Cancelled",
            body: customerBody,
            metadata: {
              orderId: updated.id,
              orderStatus: "CANCELLED",
              targetRole: "customer",
              // Twilio verified template: order_update_notification
              twilioContentSid: "HX8fc09c456a92a49269c2ba5a93e8831e",
              twilioVariables: {
                "1": updated.id.slice(0, 8).toUpperCase(),
                "2": order.restaurantName,
                "3": "Order Cancelled",
              },
            },
            channels: ["FCM", "WHATSAPP"],
          });
        }

        const [restaurant] = await db
          .select({ ownerId: restaurants.ownerId })
          .from(restaurants)
          .where(eq(restaurants.id, updated.restaurantId))
          .limit(1);

        if (restaurant?.ownerId) {
          await NotificationService.dispatchOrderNotifications({
            userId: restaurant.ownerId,
            type: "ORDER",
            subject: "Order Timed Out",
            body: ownerBody,
            metadata: {
              orderId: updated.id,
              orderStatus: "CANCELLED",
              targetRole: "owner",
              // Twilio verified template: new_order_owner_alert
              twilioContentSid: "HXd342e729a217385fbc2bc86c42e53801",
              twilioVariables: {
                "1": updated.id.slice(0, 8).toUpperCase(),
                "2": order.restaurantName,
                "3": "Timed out - no confirmation",
                "4": "N/A",
              },
            },
            channels: ["FCM", "WHATSAPP"],
          });
        }
      }
    } catch (err) {
      console.error(`[order-expiration] Notification failure for ${updated.id}:`, err);
    }
  }

  return results;
}

export async function cancelUnpaidConfirmedOrders(now = new Date()): Promise<ExpiredOrderResult[]> {
  const cutoff = new Date(now.getTime() - EXPIRY_MS);

  // Find orders that were CONFIRMED (accepted by restaurant) but not yet PAID
  // and haven't been updated for 5 minutes.
  const expiredOrders = await db
    .select({
      id: orders.id,
      sessionId: orders.sessionId,
      userId: orders.userId,
      restaurantId: orders.restaurantId,
      updatedAt: orders.updatedAt,
      restaurantName: restaurants.name,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(and(
      eq(orders.status, "CONFIRMED"),
      lt(orders.updatedAt, cutoff)
    ))
    .orderBy(desc(orders.updatedAt));

  const results: ExpiredOrderResult[] = [];

  for (const order of expiredOrders) {
    const [updated] = await db
      .update(orders)
      .set({
        status: "CANCELLED",
        cancellationReason: "Payment timeout (5 minutes)",
        updatedAt: new Date(),
      })
      .where(and(
        eq(orders.id, order.id),
        eq(orders.status, "CONFIRMED")
      ))
      .returning();

    if (!updated) continue;

    results.push({ orderId: updated.id, sessionId: updated.sessionId });

    try {
      if (updated.sessionId) {
        await syncSessionStatus(updated.sessionId);
      }
    } catch (err) {
      console.error(`[order-expiration] Failed to sync session ${updated.sessionId}:`, err);
    }

    try {
      if (order.restaurantName) {
        const customerBody = `Your order #${updated.id.slice(0, 8)} from ${order.restaurantName} was cancelled because payment was not completed within 5 minutes.`;
        const ownerBody = `Order #${updated.id.slice(0, 8)} was cancelled due to payment timeout.`;

        if (updated.userId) {
          await NotificationService.dispatchOrderNotifications({
            userId: updated.userId,
            type: "ORDER",
            subject: "Order Cancelled - Payment Timeout",
            body: customerBody,
            metadata: {
              orderId: updated.id,
              orderStatus: "CANCELLED",
              targetRole: "customer",
              twilioContentSid: "HX8fc09c456a92a49269c2ba5a93e8831e",
              twilioVariables: {
                "1": updated.id.slice(0, 8).toUpperCase(),
                "2": order.restaurantName,
                "3": "Payment Timeout",
              },
            },
            channels: ["FCM", "WHATSAPP"],
          });
        }

        const [restaurant] = await db
          .select({ ownerId: restaurants.ownerId })
          .from(restaurants)
          .where(eq(restaurants.id, updated.restaurantId))
          .limit(1);

        if (restaurant?.ownerId) {
          await NotificationService.dispatchOrderNotifications({
            userId: restaurant.ownerId,
            type: "ORDER",
            subject: "Order Timed Out (Payment)",
            body: ownerBody,
            metadata: {
              orderId: updated.id,
              orderStatus: "CANCELLED",
              targetRole: "owner",
              twilioContentSid: "HXd342e729a217385fbc2bc86c42e53801",
              twilioVariables: {
                "1": updated.id.slice(0, 8).toUpperCase(),
                "2": order.restaurantName,
                "3": "Payment Timeout",
                "4": "N/A",
              },
            },
            channels: ["FCM", "WHATSAPP"],
          });
        }
      }
    } catch (err) {
      console.error(`[order-expiration] Notification failure for ${updated.id}:`, err);
    }
  }

  return results;
}
