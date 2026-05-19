import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, settlements } from "@/lib/db/schema";
import { and, sql, sum, inArray, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getPeriodBounds(period: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === "today") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const to   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { from, to };
  }
  if (period === "week") {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
  }
  if (period === "month") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return { from, to: now };
  }
  return { from: null, to: null };
}

export async function GET(req: Request) {
  return withAuth(req, async () => {
    try {
      const url    = new URL(req.url);
      const period = url.searchParams.get("period") ?? "all";
      const { from, to } = getPeriodBounds(period);

      // Period-filtered order conditions (for the "earned in period" display)
      const periodOrderConditions = and(
        inArray(orders.status, ["PAID", "DELIVERED"]),
        from ? sql`${orders.createdAt} >= ${from.toISOString()}::timestamp` : undefined,
        to   ? sql`${orders.createdAt} <= ${to.toISOString()}::timestamp`   : undefined,
      );

      // 1. Earnings per restaurant for the selected period (display only)
      const restaurantEarnings = await db
        .select({
          restaurantId: orders.restaurantId,
          totalEarned:  sum(orders.totalAmount),
          orderCount:   sql<number>`CAST(COUNT(${orders.id}) AS INT)`,
        })
        .from(orders)
        .where(periodOrderConditions)
        .groupBy(orders.restaurantId);

      // 2. ALL-TIME settlements per restaurant (for "already paid" display)
      const restaurantSettlements = await db
        .select({
          restaurantId: settlements.restaurantId,
          totalSettled: sum(settlements.amount),
        })
        .from(settlements)
        .groupBy(settlements.restaurantId);

      // 3. ACCURATE pending balance: sum of orders where isSettled=NO (never period-filtered)
      //    This is the only correct way — earned-minus-settled can go negative when
      //    settlements cover orders from a different period than the current filter.
      const unsettledByRestaurant = await db
        .select({
          restaurantId:   orders.restaurantId,
          pendingAmount:  sum(orders.totalAmount),
          pendingCount:   sql<number>`CAST(COUNT(${orders.id}) AS INT)`,
        })
        .from(orders)
        .where(and(
          inArray(orders.status, ["PAID", "DELIVERED"]),
          eq(orders.isSettled, "NO"),
        ))
        .groupBy(orders.restaurantId);

      // 4. All restaurants
      const allRestaurants = await db
        .select({ id: restaurants.id, name: restaurants.name, logoUrl: restaurants.logoUrl })
        .from(restaurants);

      // 5. Combine
      const earningsMap   = new Map(restaurantEarnings.map(r => [r.restaurantId, r]));
      const settlementMap = new Map(restaurantSettlements.map(r => [r.restaurantId, r]));
      const unsettledMap  = new Map(unsettledByRestaurant.map(r => [r.restaurantId, r]));

      const result = allRestaurants.map(r => {
        const earned         = parseFloat(earningsMap.get(r.id)?.totalEarned    || "0");
        const paid           = parseFloat(settlementMap.get(r.id)?.totalSettled || "0");
        const pendingBalance = parseFloat(unsettledMap.get(r.id)?.pendingAmount || "0");
        const unsettledCount = unsettledMap.get(r.id)?.pendingCount ?? 0;
        const orderCount     = earningsMap.get(r.id)?.orderCount ?? 0;
        return { ...r, totalEarned: earned, totalPaid: paid, pendingBalance, unsettledCount, orderCount };
      });

      // 6. Platform service charge revenue for the period
      const [{ total: svcTotal }] = await db
        .select({ total: sum(orders.serviceCharge) })
        .from(orders)
        .where(periodOrderConditions);

      const totalPlatformRevenue = parseFloat(svcTotal || "0");
      const totalPendingPayouts  = result.reduce((s, r) => s + r.pendingBalance, 0);
      const totalSettled         = result.reduce((s, r) => s + r.totalPaid, 0);

      return ok({
        restaurants: result,
        platformSummary: { totalPlatformRevenue, totalPendingPayouts, totalSettled },
      });
    } catch (err: any) {
      console.error("[api/admin/payments GET]", err);
      return fail("Failed to fetch payment summary.", 500);
    }
  }, ["admin"]);
}
