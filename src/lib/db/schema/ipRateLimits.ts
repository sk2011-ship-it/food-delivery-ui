import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const rateLimitActionEnum = [
  "LOGIN_FAILED",
  "REGISTER",
  "FORGOT_PASSWORD",
] as const;

export const ipRateLimits = pgTable(
  "ip_rate_limits",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    ipAddress:    varchar("ip_address", { length: 255 }).notNull(),
    action:       varchar("action", { length: 32 }).$type<(typeof rateLimitActionEnum)[number]>().notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    windowStart:  timestamp("window_start").notNull(),
    blockedUntil: timestamp("blocked_until"),
    createdAt:    timestamp("created_at").defaultNow().notNull(),
    updatedAt:    timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("ip_rate_limits_ip_action_idx").on(t.ipAddress, t.action),
    index("ip_rate_limits_blocked_until_idx").on(t.blockedUntil),
    uniqueIndex("ip_rate_limits_ip_action_unique").on(t.ipAddress, t.action),
  ]
);
