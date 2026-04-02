import { pgTable, uuid, varchar, pgEnum, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const restaurantStatusEnum = pgEnum("restaurant_status", ["active", "inactive", "suspended"]);

/**
 * Opening hours stored as JSONB:
 * { mon: { open: "09:00", close: "22:00" }, tue: null, ... }
 * null for a day means closed.
 */
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type DayHours = { open: string; close: string } | null;
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

export const restaurants = pgTable("restaurants", {
  id:            uuid("id").primaryKey().defaultRandom(),
  name:          varchar("name",           { length: 150 }).notNull(),
  location:      varchar("location",       { length: 100 }),
  logoUrl:       varchar("logo_url",       { length: 500  }),
  ownerId:       uuid("owner_id").notNull().references(() => users.id),
  managerPhone:  varchar("manager_phone",  { length: 30   }),
  contactEmail:  varchar("contact_email",  { length: 150  }).notNull(),
  contactPhone:  varchar("contact_phone",  { length: 30   }).notNull(),
  businessRegNo: varchar("business_reg_no",{ length: 100  }),
  openingHours:  jsonb("opening_hours").$type<OpeningHours>(),
  status:        restaurantStatusEnum("status").default("active").notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("restaurants_name_idx").on(t.name),
  index("restaurants_owner_idx").on(t.ownerId),
  index("restaurants_status_idx").on(t.status),
  index("restaurants_created_at_idx").on(t.createdAt),
  // GIN full-text search on name + contact email
  index("restaurants_search_gin_idx")
    .using("gin", sql`to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(contact_email, ''))`),
]);
