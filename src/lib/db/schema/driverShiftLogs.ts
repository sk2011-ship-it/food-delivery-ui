import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Records every on/off shift event for drivers.
 * Populated by the Shipday webhook when a driver toggles shift status.
 * Used for the driver activity timeline graph in admin.
 */
export const driverShiftLogs = pgTable("driver_shift_logs", {
  id:               uuid("id").primaryKey().defaultRandom(),
  driverId:         uuid("driver_id").notNull(),           // users.id
  shipdayCarrierId: varchar("shipday_carrier_id", { length: 50 }),
  isOnShift:        boolean("is_on_shift").notNull(),      // true = went on shift, false = went off shift
  recordedAt:       timestamp("recorded_at").defaultNow().notNull(),
}, (t) => [
  index("shift_logs_driver_idx").on(t.driverId),
  index("shift_logs_recorded_at_idx").on(t.recordedAt),
  index("shift_logs_driver_date_idx").on(t.driverId, t.recordedAt),
]);
