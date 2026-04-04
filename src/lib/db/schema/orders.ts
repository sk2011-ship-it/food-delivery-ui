import { pgTable, uuid, text, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { restaurants } from "./restaurants";
import { menuItems } from "./menuItems";

export const orderStatusEnum = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PAID",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof orderStatusEnum)[number];

export const orders = pgTable("orders", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  restaurantId:    uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  status:          text("status").$type<OrderStatus>().default("PENDING_CONFIRMATION").notNull(),
  totalAmount:     decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency:        text("currency").default("GBP").notNull(),
  paymentIntentId: text("payment_intent_id"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("orders_user_idx").on(t.userId),
  index("orders_restaurant_idx").on(t.restaurantId),
  index("orders_status_idx").on(t.status),
]);

export const orderItems = pgTable("order_items", {
  id:         uuid("id").primaryKey().defaultRandom(),
  orderId:    uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  quantity:   integer("quantity").notNull(),
  price:      decimal("price", { precision: 10, scale: 2 }).notNull(), // Price at time of order
}, (t) => [
  index("order_items_order_idx").on(t.orderId),
]);
