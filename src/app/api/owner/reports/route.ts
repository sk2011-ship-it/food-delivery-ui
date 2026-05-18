import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, settlements } from "@/lib/db/schema";
import { eq, and, sql, sum, inArray, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getPeriodBounds(period: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === "7d")  return { from: new Date(now.getTime() - 7  * 86400_000), to: now };
  if (period === "30d") return { from: new Date(now.getTime() - 30 * 86400_000), to: now };
  if (period === "90d") return { from: new Date(now.getTime() - 90 * 86400_000), to: now };
  return { from: null, to: null };
}

/**
 * GET /api/owner/reports
 * Returns settlements + order earnings for all restaurants owned by the current user.
 * Query params:
 *   period  = 7d | 30d | 90d | all  (default: all)
 *   status  = PENDING | COMPLETED | all (default: all)
 */
export async function GET(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      const url    = new URL(req.url);
      const period = url.searchParams.get("period") ?? "all";
      const status = url.searchParams.get("status") ?? "all";

      const { from, to } = getPeriodBounds(period);

      // 1. Get all restaurants owned by this user
      const ownerRestaurants = await db
        .select({
          id:       restaurants.id,
          name:     restaurants.name,
          location: restaurants.location,
          logoUrl:  restaurants.logoUrl,
          contactPhone: restaurants.contactPhone,
        })
        .from(restaurants)
        .where(eq(restaurants.ownerId, user.id));

      if (ownerRestaurants.length === 0) {
        return ok({ restaurants: [], settlements: [], summary: { totalEarned: 0, totalSettled: 0, pendingBalance: 0, orderCount: 0 } });
      }

      const restaurantIds = ownerRestaurants.map(r => r.id);

      // 2. Order earnings per restaurant (PAID + DELIVERED orders)
      const orderConditions = and(
        inArray(orders.restaurantId, restaurantIds),
        inArray(orders.status, ["PAID", "DELIVERED"]),
        from ? gte(orders.paidAt, from) : undefined,
        to   ? lte(orders.paidAt, to)   : undefined,
      );

      const earnings = await db
        .select({
          restaurantId: orders.restaurantId,
          totalEarned:  sum(orders.totalAmount),
          orderCount:   sql<number>`CAST(COUNT(${orders.id}) AS INT)`,
        })
        .from(orders)
        .where(orderConditions)
        .groupBy(orders.restaurantId);

      // 3. Settlements for owner's restaurants
      const settlementConditions = and(
        inArray(settlements.restaurantId, restaurantIds),
        status !== "all" ? eq(settlements.status, status as "PENDING" | "COMPLETED") : undefined,
        from ? gte(settlements.createdAt, from) : undefined,
        to   ? lte(settlements.createdAt, to)   : undefined,
      );

      const settlementRows = await db
        .select({
          id:           settlements.id,
          restaurantId: settlements.restaurantId,
          amount:       settlements.amount,
          status:       settlements.status,
          transactionId: settlements.transactionId,
          periodStart:  settlements.periodStart,
          periodEnd:    settlements.periodEnd,
          notes:        settlements.notes,
          createdAt:    settlements.createdAt,
        })
        .from(settlements)
        .where(settlementConditions)
        .orderBy(sql`${settlements.createdAt} DESC`);

      // 4. Combine into per-restaurant summary
      const earningsMap = new Map(earnings.map(e => [e.restaurantId, e]));

      const restaurantSummaries = ownerRestaurants.map(r => {
        const e = earningsMap.get(r.id);
        const totalEarned  = parseFloat(e?.totalEarned ?? "0");
        const totalSettled = settlementRows
          .filter(s => s.restaurantId === r.id && s.status === "COMPLETED")
          .reduce((sum, s) => sum + parseFloat(s.amount), 0);
        return {
          ...r,
          totalEarned,
          totalSettled,
          pendingBalance: Math.max(totalEarned - totalSettled, 0),
          orderCount: e?.orderCount ?? 0,
        };
      });

      // 5. Overall summary
      const summary = {
        totalEarned:    restaurantSummaries.reduce((s, r) => s + r.totalEarned,    0),
        totalSettled:   restaurantSummaries.reduce((s, r) => s + r.totalSettled,   0),
        pendingBalance: restaurantSummaries.reduce((s, r) => s + r.pendingBalance, 0),
        orderCount:     restaurantSummaries.reduce((s, r) => s + r.orderCount,     0),
      };

      // 6. Enrich settlements with restaurant name
      const restMap = new Map(ownerRestaurants.map(r => [r.id, r.name]));
      const enrichedSettlements = settlementRows.map(s => ({
        ...s,
        restaurantName: restMap.get(s.restaurantId) ?? "Unknown",
      }));

      return ok({ restaurants: restaurantSummaries, settlements: enrichedSettlements, summary });
    } catch (err) {
      console.error("[api/owner/reports GET]", err);
      return fail("Failed to fetch reports.", 500);
    }
  });
}
