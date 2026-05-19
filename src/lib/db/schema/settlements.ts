import { pgTable, uuid, text, timestamp, decimal, index, integer, json } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";

export const settlements = pgTable("settlements", {
  id:           uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  amount:       decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status:       text("status").$type<"PENDING" | "COMPLETED">().default("COMPLETED").notNull(),
  transactionId: text("transaction_id"),
  periodStart:  timestamp("period_start"),
  periodEnd:    timestamp("period_end"),
  notes:        text("notes"),
  orderIds:     json("order_ids").$type<string[]>(),        // IDs of orders included in this settlement
  orderCount:   integer("order_count").default(0).notNull(), // Quick count without parsing JSON
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("settlements_restaurant_idx").on(t.restaurantId),
  index("settlements_created_at_idx").on(t.createdAt),
]);
