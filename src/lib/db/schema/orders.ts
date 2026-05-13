import { pgTable, uuid, text, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { restaurants } from "./restaurants";
import { menuItems } from "./menuItems";
import { orderSessions } from "./orderSessions";

export const orderStatusEnum = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PAID",
  "PREPARING",
  "DISPATCH_REQUESTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "CANCELLED_BY_USER",
] as const;

export type OrderStatus = (typeof orderStatusEnum)[number];

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // nullable – preserved when user deletes account
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  status:          text("status").$type<OrderStatus>().default("PENDING_CONFIRMATION").notNull(),
  totalAmount:     decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryFee:     decimal("delivery_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  serviceCharge:   decimal("service_charge", { precision: 10, scale: 2 }).default("0").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryArea:    text("delivery_area"),
  distanceMiles:   decimal("distance_miles", { precision: 10, scale: 4 }),
  customerPhone:   text("customer_phone"),
  currency:        text("currency").default("GBP").notNull(),
  paymentIntentId: text("payment_intent_id"),
  isSettled:       text("is_settled").$type<"YES" | "NO">().default("NO").notNull(),
  sessionId:       uuid("session_id").references(() => orderSessions.id, { onDelete: "set null" }),
  restaurantNameSnapshot: text("restaurant_name_snapshot"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
  paidAt:          timestamp("paid_at"),
  refundId:        text("refund_id"),
  refundStatus:    text("refund_status"),
  cancellationReason: text("cancellation_reason"),
}, (t) => [
  index("orders_user_idx").on(t.userId),
  index("orders_restaurant_idx").on(t.restaurantId),
  index("orders_status_idx").on(t.status),
  index("orders_session_idx").on(t.sessionId),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price at time of order
}, (t) => [
  index("order_items_order_idx").on(t.orderId),
]);
