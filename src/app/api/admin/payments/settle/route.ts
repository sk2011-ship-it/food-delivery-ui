import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, settlements, restaurants } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/payments/settle
 * Processes a settlement for a restaurant.
 */
export async function POST(req: Request) {
  return withAuth(req, async () => {
    try {
      const { restaurantId, orderIds, transactionId, notes } = await req.json();

      if (!restaurantId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return fail("Restaurant ID and a non-empty list of Order IDs are required.", 400);
      }

      // 1. Fetch restaurant and orders to calculate the total
      const [rest] = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (!rest) return fail("Restaurant not found.", 404);

      const targetedOrders = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(and(
          eq(orders.restaurantId, restaurantId),
          inArray(orders.id, orderIds),
          eq(orders.isSettled, "NO"),
          inArray(orders.status, ["PAID", "DELIVERED"])
        ));

      if (targetedOrders.length === 0) {
        return fail("No valid eligible orders found for settlement.", 400);
      }

      const totalOrderValue = targetedOrders.reduce((sum, o) => {
        return sum + parseFloat(o.totalAmount || "0");
      }, 0);

      const totalEarningsAmount = totalOrderValue;

      // Determine date range for the settlement
      const dates = targetedOrders.map(o => new Date(o.createdAt).getTime());
      const periodStart = new Date(Math.min(...dates));
      const periodEnd = new Date(Math.max(...dates));

      // 2. Perform atomic update
      const result = await db.transaction(async (tx) => {
        // a. Create settlement record
        const [settlement] = await tx.insert(settlements).values({
          restaurantId,
          amount: totalEarningsAmount.toFixed(2),
          status: "COMPLETED",
          transactionId,
          periodStart,
          periodEnd,
          notes,
          orderIds: targetedOrders.map(o => o.id),
          orderCount: targetedOrders.length,
        }).returning();

        // b. Mark orders as settled
        await tx.update(orders)
          .set({ isSettled: "YES" })
          .where(inArray(orders.id, orderIds));

        return settlement;
      });

      return ok({ settlement: result });
    } catch (err: any) {
      console.error("[api/admin/payments/settle POST]", err);
      return fail("Failed to process settlement.", 500);
    }
  }, ["admin"]);
}
