import { pgTable, uuid, text, timestamp, decimal, integer, index, unique } from "drizzle-orm/pg-core";

/**
 * orderMetrics — one row per order, filled in incrementally as the order moves through its lifecycle.
 * Tracks all key timestamps and pre-calculates timing gaps (ms) for fast admin analytics.
 * Never referenced by the orders table — insert/update only from the metrics helper.
 */
export const orderMetrics = pgTable("order_metrics", {
  id:           uuid("id").primaryKey().defaultRandom(),
  orderId:      uuid("order_id").notNull(),         // FK to orders (no drizzle ref — avoids circular dep)
  sessionId:    uuid("session_id"),                  // FK to orderSessions
  userId:       uuid("user_id"),                     // snapshot — preserved if user deleted
  restaurantId: uuid("restaurant_id"),               // snapshot — preserved if restaurant deleted

  // ── Lifecycle timestamps ──────────────────────────────────────────────
  orderPlacedAt:      timestamp("order_placed_at"),       // order created
  ownerNotifiedAt:    timestamp("owner_notified_at"),     // FCM fired to owner
  confirmedAt:        timestamp("confirmed_at"),          // owner accepted
  paymentInitiatedAt: timestamp("payment_initiated_at"), // customer opened Stripe
  paidAt:             timestamp("paid_at"),               // Stripe confirmed payment
  kitchenStartedAt:   timestamp("kitchen_started_at"),   // PREPARING
  dispatchedAt:       timestamp("dispatched_at"),         // OUT_FOR_DELIVERY
  deliveredAt:        timestamp("delivered_at"),          // DELIVERED
  cancelledAt:        timestamp("cancelled_at"),          // CANCELLED

  // ── Pre-calculated timing gaps (milliseconds) ─────────────────────────
  waitTimeMs:          integer("wait_time_ms"),          // confirmedAt  - orderPlacedAt (customer wait)
  paymentDelayMs:      integer("payment_delay_ms"),      // paidAt       - confirmedAt   (how fast customer paid)
  kitchenTimeMs:       integer("kitchen_time_ms"),       // dispatchedAt - paidAt        (prep time)
  deliveryTimeMs:      integer("delivery_time_ms"),      // deliveredAt  - dispatchedAt
  totalFulfillmentMs:  integer("total_fulfillment_ms"),  // deliveredAt  - orderPlacedAt

  // ── Context snapshot (captured at order creation) ─────────────────────
  cancellationReason: text("cancellation_reason"),  // 'timeout' | 'owner_rejected' | 'customer_cancelled'
  deliveryArea:       text("delivery_area"),
  dayOfWeek:          integer("day_of_week"),        // 0 Mon → 6 Sun
  hourOfDay:          integer("hour_of_day"),        // 0–23
  orderTotal:         decimal("order_total", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("order_metrics_order_id_unique").on(t.orderId),
  index("order_metrics_user_idx").on(t.userId),
  index("order_metrics_restaurant_idx").on(t.restaurantId),
  index("order_metrics_session_idx").on(t.sessionId),
  index("order_metrics_placed_idx").on(t.orderPlacedAt),
  index("order_metrics_restaurant_confirmed_idx").on(t.restaurantId, t.confirmedAt),
]);
