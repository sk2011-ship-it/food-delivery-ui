import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, settlements } from "@/lib/db/schema";
import { and, sql, sum, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getPeriodBounds(period: string): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (period === "today") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const to   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { from, to };
  }
  if (period === "week") {
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from, to: now };
  }
  if (period === "month") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return { from, to: now };
  }
  return { from: null, to: null }; // all time
}

export async function GET(req: Request) {
  return withAuth(req, async () => {
    try {
      const url    = new URL(req.url);
      const period = url.searchParams.get("period") ?? "all";

      const { from, to } = getPeriodBounds(period);

      // Build WHERE conditions for orders
      const orderConditions = and(
        inArray(orders.status, ["PAID", "DELIVERED"]),
        from ? sql`${orders.createdAt} >= ${from.toISOString()}::timestamp` : undefined,
        to   ? sql`${orders.createdAt} <= ${to.toISOString()}::timestamp`   : undefined,
      );

      // Build WHERE conditions for settlements
      const settlementConditions = (from || to) ? and(
        from ? sql`${settlements.createdAt} >= ${from.toISOString()}::timestamp` : undefined,
        to   ? sql`${settlements.createdAt} <= ${to.toISOString()}::timestamp`   : undefined,
      ) : undefined;

      // 1. Earnings per restaurant for the period
      const restaurantEarnings = await db
        .select({
          restaurantId: orders.restaurantId,
          totalEarned:  sum(orders.totalAmount),
          orderCount:   sql<number>`CAST(COUNT(${orders.id}) AS INT)`,
        })
        .from(orders)
        .where(orderConditions)
        .groupBy(orders.restaurantId);

      // 2. Settlements for the period
      const restaurantSettlements = await db
        .select({
          restaurantId: settlements.restaurantId,
          totalSettled: sum(settlements.amount),
        })
        .from(settlements)
        .where(settlementConditions)
        .groupBy(settlements.restaurantId);

      // 3. All restaurants
      const allRestaurants = await db
        .select({ id: restaurants.id, name: restaurants.name, logoUrl: restaurants.logoUrl })
        .from(restaurants);

      // 4. Combine
      const earningsMap   = new Map(restaurantEarnings.map(r => [r.restaurantId, r]));
      const settlementMap = new Map(restaurantSettlements.map(r => [r.restaurantId, r]));

      const result = allRestaurants.map(r => {
        const earned  = parseFloat(earningsMap.get(r.id)?.totalEarned   || "0");
        const paid    = parseFloat(settlementMap.get(r.id)?.totalSettled || "0");
        const orderCount = earningsMap.get(r.id)?.orderCount ?? 0;
        return { ...r, totalEarned: earned, totalPaid: paid, pendingBalance: earned - paid, orderCount };
      });

      // 5. Platform service charge revenue for the period
      const [{ total: svcTotal }] = await db
        .select({ total: sum(orders.serviceCharge) })
        .from(orders)
        .where(orderConditions);

      const totalPlatformRevenue = parseFloat(svcTotal || "0");
      const totalPendingPayouts  = result.reduce((s, r) => s + Math.max(r.pendingBalance, 0), 0);
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
