import { ok, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/drivers/live-status
 * Returns on-shift status for all drivers from DB (kept fresh via Shipday webhook).
 * Response: { [carrierId]: { isOnShift: boolean } }
 */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    const drivers = await db
      .select({ shipdayCarrierId: users.shipdayCarrierId, isOnShift: users.isOnShift })
      .from(users)
      .where(eq(users.role, "driver"));

    const statusMap: Record<string, { isOnShift: boolean }> = {};
    for (const d of drivers) {
      if (d.shipdayCarrierId && d.shipdayCarrierId !== "undefined") {
        statusMap[d.shipdayCarrierId] = { isOnShift: d.isOnShift ?? false };
      }
    }
    return ok(statusMap);
  }, ["admin"]);
}
