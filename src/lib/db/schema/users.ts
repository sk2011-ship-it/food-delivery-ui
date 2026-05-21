import { pgTable, uuid, varchar, text, pgEnum, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", ["active", "banned"]);
export const userRoleEnum = pgEnum("user_role", ["customer", "admin", "driver", "owner"]);

export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      varchar("name",  { length: 150 }).notNull(),
  email:     varchar("email", { length: 150 }).notNull().unique(),
  phone:     varchar("phone", { length: 30  }).notNull(),
  status:    userStatusEnum("status").default("active").notNull(),
  role:      userRoleEnum("role").default("customer").notNull(),
  lastActive:       timestamp("last_active"),
  fcmToken:         text("fcm_token"),          // JSON array of tokens — supports multi-device
  shipdayCarrierId: varchar("shipday_carrier_id", { length: 50 }),  // Shipday carrierId for drivers
  isOnShift:        boolean("is_on_shift"),                          // Live on-shift status, updated via Shipday webhook
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // B-tree: ORDER BY name / ORDER BY created_at
  index("users_name_idx").on(t.name),
  index("users_created_at_idx").on(t.createdAt),
  // B-tree: WHERE role = ? / WHERE status = ? / WHERE role = ? AND status = ?
  index("users_role_idx").on(t.role),
  index("users_status_idx").on(t.status),
  index("users_role_status_idx").on(t.role, t.status),
  // GIN: full-text search on name + email via to_tsvector (replaces slow ILIKE '%…%')
  index("users_search_gin_idx")
    .using("gin", sql`to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(email, ''))`),
]);
