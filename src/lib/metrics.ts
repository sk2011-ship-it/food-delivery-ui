import { db } from "./db";
import { orderMetrics } from "./db/schema/orderMetrics";
import { eq } from "drizzle-orm";

type MetricUpdate = {
  sessionId?: string;
  userId?: string;
  restaurantId?: string;
  orderPlacedAt?: Date;
  ownerNotifiedAt?: Date;
  confirmedAt?: Date;
  paymentInitiatedAt?: Date;
  paidAt?: Date;
  kitchenStartedAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  deliveryArea?: string;
  dayOfWeek?: number;
  hourOfDay?: number;
  orderTotal?: string;
};

/**
 * trackOrderMetric — upsert a partial metric update for an order.
 *
 * - Fetches existing row to compute timing gaps (waitTimeMs, paymentDelayMs, etc.)
 * - Never throws — metrics must never break the main order flow.
 * - Always call this in a background/void context, not in the critical path.
 */
export async function trackOrderMetric(orderId: string, update: MetricUpdate): Promise<void> {
  try {
    const [existing] = await db
      .select()
      .from(orderMetrics)
      .where(eq(orderMetrics.orderId, orderId))
      .limit(1);

    const now = new Date();

    // Merge existing + incoming so gap calculations can see all available timestamps
    const merged = { ...(existing ?? {}), ...update } as Record<string, any>;

    const gaps: {
      waitTimeMs?: number;
      paymentDelayMs?: number;
      kitchenTimeMs?: number;
      deliveryTimeMs?: number;
      totalFulfillmentMs?: number;
    } = {};

    if (merged.confirmedAt && merged.orderPlacedAt) {
      gaps.waitTimeMs = new Date(merged.confirmedAt).getTime() - new Date(merged.orderPlacedAt).getTime();
    }
    if (merged.paidAt && merged.confirmedAt) {
      gaps.paymentDelayMs = new Date(merged.paidAt).getTime() - new Date(merged.confirmedAt).getTime();
    }
    if (merged.dispatchedAt && merged.paidAt) {
      gaps.kitchenTimeMs = new Date(merged.dispatchedAt).getTime() - new Date(merged.paidAt).getTime();
    }
    if (merged.deliveredAt && merged.dispatchedAt) {
      gaps.deliveryTimeMs = new Date(merged.deliveredAt).getTime() - new Date(merged.dispatchedAt).getTime();
    }
    if (merged.deliveredAt && merged.orderPlacedAt) {
      gaps.totalFulfillmentMs = new Date(merged.deliveredAt).getTime() - new Date(merged.orderPlacedAt).getTime();
    }

    const payload = { ...update, ...gaps, updatedAt: now };

    if (existing) {
      await db.update(orderMetrics).set(payload).where(eq(orderMetrics.orderId, orderId));
    } else {
      await db.insert(orderMetrics).values({ orderId, ...payload });
    }
  } catch (err) {
    // Intentional: metrics must never surface errors to callers
    console.error(`[trackOrderMetric] Failed for order ${orderId}:`, err);
  }
}
