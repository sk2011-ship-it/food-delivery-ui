import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { driverShiftLogs, users } from "@/lib/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";

/**
 * GET /api/admin/drivers/[id]/shift-logs?year=2026&month=5
 * Returns all shift on/off events for a driver in a given month.
 * Used to build the activity timeline graph.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const now   = new Date();
    const year  = Number(searchParams.get("year")  ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1); // 1-12

    // Verify driver exists
    const [driver] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "driver")))
      .limit(1);

    if (!driver) return fail("Driver not found.", 404);

    const from = new Date(year, month - 1, 1, 0, 0, 0);
    const to   = new Date(year, month,     0, 23, 59, 59); // last day of month

    const logs = await db
      .select({
        id:         driverShiftLogs.id,
        isOnShift:  driverShiftLogs.isOnShift,
        recordedAt: driverShiftLogs.recordedAt,
      })
      .from(driverShiftLogs)
      .where(
        and(
          eq(driverShiftLogs.driverId, id),
          gte(driverShiftLogs.recordedAt, from),
          lte(driverShiftLogs.recordedAt, to),
        )
      )
      .orderBy(asc(driverShiftLogs.recordedAt));

    // Build day-level summary: for each day of the month, total minutes on shift
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayMap: Record<number, { onMinutes: number; events: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) dayMap[d] = { onMinutes: 0, events: 0 };

    // Walk through logs in pairs to calculate on-shift durations
    let onShiftStart: Date | null = null;
    for (const log of logs) {
      const day = new Date(log.recordedAt).getDate();
      dayMap[day].events++;
      if (log.isOnShift) {
        onShiftStart = new Date(log.recordedAt);
      } else if (onShiftStart) {
        const minutes = Math.round((new Date(log.recordedAt).getTime() - onShiftStart.getTime()) / 60000);
        dayMap[day].onMinutes += minutes;
        onShiftStart = null;
      }
    }

    const days = Object.entries(dayMap).map(([day, data]) => ({
      day:       Number(day),
      onMinutes: data.onMinutes,
      events:    data.events,
    }));

    return ok({ driverName: driver.name, year, month, days, logs });
  }, ["admin"]);
}
