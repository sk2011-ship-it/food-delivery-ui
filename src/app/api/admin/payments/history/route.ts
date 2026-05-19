import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, settlements } from "@/lib/db/schema";
import { eq, and, inArray, desc, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getPeriodBounds(period: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === "7d")   return { from: new Date(now.getTime() - 7  * 86400_000), to: now };
  if (period === "30d")  return { from: new Date(now.getTime() - 30 * 86400_000), to: now };
  if (period === "90d")  return { from: new Date(now.getTime() - 90 * 86400_000), to: now };
  return { from: null, to: null };
}

/**
 * GET /api/admin/payments/history
 * Returns all settlements with restaurant details and the orders included in each.
 * Query params:
 *   period  = 7d | 30d | 90d | all  (default: all)
 *   restaurantId = filter by restaurant (optional)
 */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    try {
      const url          = new URL(req.url);
      const period       = url.searchParams.get("period") ?? "all";
      const restaurantId = url.searchParams.get("restaurantId") ?? null;
      const { from, to } = getPeriodBounds(period);

      // 1. Fetch settlements (newest first)
      const conditions = and(
        restaurantId ? eq(settlements.restaurantId, restaurantId) : undefined,
        from ? gte(settlements.createdAt, from) : undefined,
        to   ? lte(settlements.createdAt, to)   : undefined,
      );

      const rows = await db
        .select({
          id:            settlements.id,
          restaurantId:  settlements.restaurantId,
          amount:        settlements.amount,
          status:        settlements.status,
          transactionId: settlements.transactionId,
          periodStart:   settlements.periodStart,
          periodEnd:     settlements.periodEnd,
          notes:         settlements.notes,
          orderIds:      settlements.orderIds,
          orderCount:    settlements.orderCount,
          createdAt:     settlements.createdAt,
        })
        .from(settlements)
        .where(conditions)
        .orderBy(desc(settlements.createdAt));

      if (rows.length === 0) {
        return ok({ settlements: [] });
      }

      // 2. Fetch restaurant names
      const restaurantIds = [...new Set(rows.map(r => r.restaurantId))];
      const restRows = await db
        .select({ id: restaurants.id, name: restaurants.name, logoUrl: restaurants.logoUrl })
        .from(restaurants)
        .where(inArray(restaurants.id, restaurantIds));
      const restMap = new Map(restRows.map(r => [r.id, r]));

      // 3. For each settlement, fetch its orders using stored orderIds.
      //    Fall back to period+restaurant query for legacy settlements without orderIds.
      const allStoredIds = rows.flatMap(r => r.orderIds ?? []);
      const orderMap = new Map<string, { id: string; totalAmount: string; paidAt: Date | null; createdAt: Date; status: string }>();

      if (allStoredIds.length > 0) {
        const orderRows = await db
          .select({
            id:          orders.id,
            totalAmount: orders.totalAmount,
            paidAt:      orders.paidAt,
            createdAt:   orders.createdAt,
            status:      orders.status,
          })
          .from(orders)
          .where(inArray(orders.id, allStoredIds));
        for (const o of orderRows) orderMap.set(o.id, o);
      }

      // 4. Build response
      const enriched = await Promise.all(rows.map(async (s) => {
        const rest = restMap.get(s.restaurantId);

        let settlementOrders: { id: string; totalAmount: string; date: string; status: string }[] = [];

        if (s.orderIds && s.orderIds.length > 0) {
          // New settlements: use stored orderIds
          settlementOrders = s.orderIds
            .map(id => orderMap.get(id))
            .filter(Boolean)
            .map(o => ({
              id: o!.id,
              totalAmount: o!.totalAmount,
              date: (o!.paidAt ?? o!.createdAt).toISOString(),
              status: o!.status,
            }));
        } else if (s.periodStart && s.periodEnd) {
          // Legacy settlements: reconstruct from period range
          const legacyOrders = await db
            .select({
              id:          orders.id,
              totalAmount: orders.totalAmount,
              paidAt:      orders.paidAt,
              createdAt:   orders.createdAt,
              status:      orders.status,
            })
            .from(orders)
            .where(and(
              eq(orders.restaurantId, s.restaurantId),
              eq(orders.isSettled, "YES"),
              inArray(orders.status, ["PAID", "DELIVERED"]),
              gte(orders.createdAt, s.periodStart),
              lte(orders.createdAt, s.periodEnd),
            ));
          settlementOrders = legacyOrders.map(o => ({
            id: o.id,
            totalAmount: o.totalAmount,
            date: (o.paidAt ?? o.createdAt).toISOString(),
            status: o.status,
          }));
        }

        return {
          id:            s.id,
          restaurantId:  s.restaurantId,
          restaurantName: rest?.name ?? "Unknown",
          restaurantLogo: rest?.logoUrl ?? null,
          amount:        s.amount,
          status:        s.status,
          transactionId: s.transactionId,
          periodStart:   s.periodStart?.toISOString() ?? null,
          periodEnd:     s.periodEnd?.toISOString() ?? null,
          notes:         s.notes,
          orderCount:    s.orderCount > 0 ? s.orderCount : settlementOrders.length,
          createdAt:     s.createdAt.toISOString(),
          orders:        settlementOrders,
        };
      }));

      return ok({ settlements: enriched });
    } catch (err) {
      console.error("[api/admin/payments/history GET]", err);
      return fail("Failed to fetch settlement history.", 500);
    }
  }, ["admin"]);
}
