import { ok, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users, driverShiftLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listShipdayCarriers } from "@/lib/shipday";

/**
 * GET /api/admin/drivers/live-status
 *
 * Polls Shipday GET /carriers for current isOnShift status on every request.
 * Shipday has no shift-change webhook, so polling is the only mechanism.
 *
 * Side effect: when a driver's isOnShift value differs from what's stored in
 * our DB, we update users.isOnShift and append a driver_shift_logs entry so
 * the activity timeline graph stays accurate.
 *
 * Response: { [shipdayCarrierId]: { isOnShift: boolean, isActive: boolean } }
 */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    // 1. Fetch current status from Shipday
    let carriers;
    try {
      carriers = await listShipdayCarriers();
    } catch (err) {
      console.error("[live-status] Shipday fetch failed:", err);
      // Fall back to DB values so the UI still shows something
      const dbDrivers = await db
        .select({ shipdayCarrierId: users.shipdayCarrierId, isOnShift: users.isOnShift })
        .from(users)
        .where(eq(users.role, "driver"));

      const fallback: Record<string, { isOnShift: boolean; isActive: boolean }> = {};
      for (const d of dbDrivers) {
        if (d.shipdayCarrierId && d.shipdayCarrierId !== "undefined") {
          fallback[d.shipdayCarrierId] = { isOnShift: d.isOnShift ?? false, isActive: true };
        }
      }
      return ok(fallback);
    }

    if (carriers.length === 0) return ok({});

    // 2. Load our drivers from DB (keyed by shipdayCarrierId)
    const dbDrivers = await db
      .select({ id: users.id, shipdayCarrierId: users.shipdayCarrierId, isOnShift: users.isOnShift })
      .from(users)
      .where(eq(users.role, "driver"));

    const dbByCarrierId = new Map(
      dbDrivers
        .filter((d) => d.shipdayCarrierId && d.shipdayCarrierId !== "undefined")
        .map((d) => [d.shipdayCarrierId!, d])
    );

    // 3. Build status map and persist any changes
    const statusMap: Record<string, { isOnShift: boolean; isActive: boolean }> = {};

    for (const carrier of carriers) {
      if (!carrier.carrierId) continue;
      const carrierId = String(carrier.carrierId);
      statusMap[carrierId] = { isOnShift: carrier.isOnShift, isActive: carrier.isActive };

      const dbDriver = dbByCarrierId.get(carrierId);
      if (!dbDriver) continue;

      // Persist change only when isOnShift value differs from what we have stored
      if ((dbDriver.isOnShift ?? false) !== carrier.isOnShift) {
        await db
          .update(users)
          .set({ isOnShift: carrier.isOnShift, updatedAt: new Date() })
          .where(eq(users.id, dbDriver.id));

        await db.insert(driverShiftLogs).values({
          driverId:         dbDriver.id,
          shipdayCarrierId: carrierId,
          isOnShift:        carrier.isOnShift,
        });

        console.log(
          `[live-status] Driver ${dbDriver.id} (carrier ${carrierId}) isOnShift changed: ${dbDriver.isOnShift} → ${carrier.isOnShift}`
        );
      }
    }

    return ok(statusMap);
  }, ["admin"]);
}
