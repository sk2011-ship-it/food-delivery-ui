import {
  pgTable, uuid, varchar, text, numeric,
  pgEnum, timestamp, index,
} from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";

export const menuItemStatusEnum = pgEnum("menu_item_status", ["available", "unavailable"]);

export const menuItems = pgTable("menu_items", {
  id:           uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name:         varchar("name",        { length: 150 }).notNull(),
  description:  text("description"),
  category:     varchar("category",    { length: 100 }).notNull(),
  price:        numeric("price",       { precision: 10, scale: 2 }).notNull(),
  status:       menuItemStatusEnum("status").default("available").notNull(),
  imageUrl:     varchar("image_url",   { length: 500 }).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("menu_items_restaurant_idx").on(t.restaurantId),
  index("menu_items_status_idx").on(t.status),
  index("menu_items_category_idx").on(t.category),
]);
