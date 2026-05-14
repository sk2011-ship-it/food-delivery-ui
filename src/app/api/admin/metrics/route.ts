import { db } from "@/lib/db";
import { orderMetrics } from "@/lib/db/schema/orderMetrics";
import { restaurants, users } from "@/lib/db/schema";
import { eq, isNotNull, sql, count, and, gte, lt, ilike, or } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/metrics
 *
 * Query params (all optional):
 *   month=YYYY-MM          filter to a calendar month  e.g. 2026-05
 *   userId=<uuid>          drill into one customer
 *   q=<string>             search customers by name/email (returns customer list only)
 */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const month    = searchParams.get("month");     // "2026-05"
      const userId   = searchParams.get("userId");
      const q        = searchParams.get("q");

      // ── Customer search mode ────────────────────────────────────────────
      // Returns distinct customers who have metric rows, optionally filtered by name/email
      if (q !== null) {
        const customerRows = await db
          .selectDistinct({
            userId: orderMetrics.userId,
            name:   users.name,
            email:  users.email,
          })
          .from(orderMetrics)
          .innerJoin(users, eq(orderMetrics.userId, users.id))
          .where(
            q.trim()
              ? or(
                  ilike(users.name,  `%${q.trim()}%`),
                  ilike(users.email, `%${q.trim()}%`)
                )
              : undefined
          )
          .limit(20);

        return ok({ customers: customerRows });
      }

      // ── Build shared WHERE clause ───────────────────────────────────────
      const conditions: ReturnType<typeof eq>[] = [];

      if (month) {
        const [year, mon] = month.split("-").map(Number);
        const start = new Date(year, mon - 1, 1);
        const end   = new Date(year, mon,     1);
        conditions.push(gte(orderMetrics.orderPlacedAt, start) as any);
        conditions.push(lt(orderMetrics.orderPlacedAt,  end)   as any);
      }

      if (userId) {
        conditions.push(eq(orderMetrics.userId, userId) as any);
      }

      const where = conditions.length > 0 ? and(...(conditions as any)) : undefined;

      // ── Platform / customer stats ───────────────────────────────────────
      const [platform] = await db
        .select({
          totalOrders:             count(orderMetrics.id),
          acceptedOrders:          sql<number>`COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL)`,
          timedOutOrders:          sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'timeout')`,
          ownerRejectedOrders:     sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'owner_rejected')`,
          customerCancelledOrders: sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'customer_cancelled')`,
          avgWaitTimeMs:           sql<number>`ROUND(AVG(wait_time_ms))`,
          avgPaymentDelayMs:       sql<number>`ROUND(AVG(payment_delay_ms))`,
          avgKitchenTimeMs:        sql<number>`ROUND(AVG(kitchen_time_ms))`,
          avgDeliveryTimeMs:       sql<number>`ROUND(AVG(delivery_time_ms))`,
          avgTotalFulfillmentMs:   sql<number>`ROUND(AVG(total_fulfillment_ms))`,
          revenueLost:             sql<number>`COALESCE(SUM(CASE WHEN cancellation_reason = 'timeout' THEN order_total::numeric ELSE 0 END), 0)`,
        })
        .from(orderMetrics)
        .where(where);

      // ── Per-restaurant breakdown ─────────────────────────────────────────
      const restaurantStats = await db
        .select({
          restaurantId:   orderMetrics.restaurantId,
          name:           restaurants.name,
          totalOrders:    count(orderMetrics.id),
          acceptedOrders: sql<number>`COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL)`,
          timedOutOrders: sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'timeout')`,
          avgWaitTimeMs:  sql<number>`ROUND(AVG(wait_time_ms))`,
        })
        .from(orderMetrics)
        .leftJoin(restaurants, eq(orderMetrics.restaurantId, restaurants.id))
        .where(where)
        .groupBy(orderMetrics.restaurantId, restaurants.name)
        .orderBy(sql`COUNT(*) DESC`);

      // ── Hourly breakdown ────────────────────────────────────────────────
      const hourlyStats = await db
        .select({
          hour:          orderMetrics.hourOfDay,
          orderCount:    count(orderMetrics.id),
          avgWaitTimeMs: sql<number>`ROUND(AVG(wait_time_ms))`,
          timeoutCount:  sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'timeout')`,
        })
        .from(orderMetrics)
        .where(and(isNotNull(orderMetrics.hourOfDay), where) as any)
        .groupBy(orderMetrics.hourOfDay)
        .orderBy(orderMetrics.hourOfDay);

      // ── Day-of-week breakdown ────────────────────────────────────────────
      const dailyStats = await db
        .select({
          day:           orderMetrics.dayOfWeek,
          orderCount:    count(orderMetrics.id),
          avgWaitTimeMs: sql<number>`ROUND(AVG(wait_time_ms))`,
          timeoutCount:  sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'timeout')`,
        })
        .from(orderMetrics)
        .where(and(isNotNull(orderMetrics.dayOfWeek), where) as any)
        .groupBy(orderMetrics.dayOfWeek)
        .orderBy(orderMetrics.dayOfWeek);

      // ── Month-by-month trend (always returned, ignores month filter) ────
      const monthlyTrend = await db
        .select({
          month:         sql<string>`TO_CHAR(order_placed_at, 'YYYY-MM')`,
          orderCount:    count(orderMetrics.id),
          acceptedCount: sql<number>`COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL)`,
          timeoutCount:  sql<number>`COUNT(*) FILTER (WHERE cancellation_reason = 'timeout')`,
          avgWaitTimeMs: sql<number>`ROUND(AVG(wait_time_ms))`,
        })
        .from(orderMetrics)
        .where(
          userId
            ? eq(orderMetrics.userId, userId)
            : isNotNull(orderMetrics.orderPlacedAt)
        )
        .groupBy(sql`TO_CHAR(order_placed_at, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(order_placed_at, 'YYYY-MM') ASC`);

      // ── Customer profile (only when userId supplied) ────────────────────
      let customerProfile = null;
      if (userId) {
        const [profile] = await db
          .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        customerProfile = profile ?? null;
      }

      return ok({
        platform,
        restaurants: restaurantStats,
        hourly: hourlyStats,
        daily: dailyStats,
        monthlyTrend,
        customerProfile,
        activeFilters: { month: month ?? null, userId: userId ?? null },
      });
    } catch (err) {
      console.error("[GET /api/admin/metrics]", err);
      return fail("Failed to load metrics.", 500);
    }
  }, ["admin"]);
}
