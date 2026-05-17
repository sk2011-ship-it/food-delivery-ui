import { pgTable, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Single-row table (id always = 1)
export const platformSettings = pgTable("platform_settings", {
  id:        integer("id").primaryKey().default(1),
  isOpen:    boolean("is_open").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
