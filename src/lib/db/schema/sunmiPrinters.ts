import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";

export const sunmiPrinters = pgTable("sunmi_printers", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  shopId: text("shop_id").notNull(),
  printerMsn: text("printer_msn").notNull(),
  status: text("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("sunmi_printers_restaurant_unique").on(t.restaurantId),
  index("sunmi_printers_shop_idx").on(t.shopId),
  index("sunmi_printers_msn_idx").on(t.printerMsn),
]);

