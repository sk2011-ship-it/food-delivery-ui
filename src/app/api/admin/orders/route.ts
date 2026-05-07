import { db } from "@/lib/db";
import { orders, users, orderItems, restaurants, type OrderStatus } from "@/lib/db/schema";
import { sql, desc, and, eq, gte, lte, inArray } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";

/**
 * GET /api/admin/orders
 * Returns filtered platform orders with stats for admin dashboard.
 */
export async function GET(req: Request) {
  return withAuth(
    req,
    async () => {
      try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 1000);
        const offset = parseInt(searchParams.get("offset") || "0");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // 1. Build dynamic filters
        const conditions = [];
        if (status) {
          conditions.push(eq(orders.status, status as OrderStatus));
        }
        if (startDate) {
          conditions.push(gte(orders.createdAt, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lte(orders.createdAt, new Date(endDate)));
        }

        const filterCondition = conditions.length > 0 ? and(...conditions) : undefined;

        // 2. Fetch stats and total count
        const [statsRes, [{ count: totalCount }], customersCountRes] = await Promise.all([
          // A. Aggregate stats
          db.select({
            totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} != 'CANCELLED' THEN ${orders.totalAmount} ELSE 0 END), 0)`,
            totalOrders: sql<number>`CAST(COUNT(*) AS INT)`,
            pendingOrders: sql<number>`CAST(COUNT(*) FILTER (WHERE ${orders.status} NOT IN ('DELIVERED', 'CANCELLED')) AS INT)`,
          })
          .from(orders),

          // B. Count for pagination
          db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
          .from(orders)
          .where(filterCondition),

          // C. Total Customers
          db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
          .from(users)
          .where(eq(users.role, "customer"))
        ]);

        // 3. Fetch detailed order list with manual joins (to avoid db.query possible innerJoin issues)
        const allOrdersRaw = await db
          .select({
            id: orders.id,
            status: orders.status,
            totalAmount: orders.totalAmount,
            deliveryAddress: orders.deliveryAddress,
            customerPhone: orders.customerPhone,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
              phone: users.phone,
            },
            restaurant: {
              id: restaurants.id,
              name: restaurants.name,
            },
          })
          .from(orders)
          .leftJoin(users, eq(orders.userId, users.id))
          .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
          .where(filterCondition)
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset);

        // Fetch items separately for each order (to avoid complex reassembly in select)
        const orderIds = allOrdersRaw.map(o => o.id);
        const allItems = orderIds.length > 0 
          ? await db.query.orderItems.findMany({
              where: inArray(orderItems.orderId, orderIds),
              with: { menuItem: { columns: { name: true } } }
            })
          : [];

        const allOrders = allOrdersRaw.map(o => ({
          ...o,
          items: allItems.filter(item => item.orderId === o.id)
        }));

        const stats = statsRes[0] || { totalRevenue: "0", totalOrders: 0, pendingOrders: 0 };
        const totalCustomers = customersCountRes ? customersCountRes[0]?.count || 0 : 0;

        return ok({
          orders: allOrders,
          stats: {
            totalRevenue: stats.totalRevenue || "0.00",
            totalOrders: stats.totalOrders || 0,
            pendingOrders: stats.pendingOrders || 0,
            totalCustomers: totalCustomers,
          },
          pagination: {
            total: totalCount,
            limit,
            offset,
          }
        });
      } catch (error: unknown) {
        console.error("[AdminOrders API Error]:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch platform orders.";
        return fail(message, 500);
      }
    },
    ["admin"]
  );
}
