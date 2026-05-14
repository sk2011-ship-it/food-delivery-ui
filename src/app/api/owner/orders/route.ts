import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, restaurants, menuItems, deliveryJobs } from "@/lib/db/schema";
import { eq, inArray, desc, sql, and, sum } from "drizzle-orm";
import { cancelExpiredPendingOrders } from "@/lib/order-expiration";

export const dynamic = "force-dynamic";

/**
 * GET /api/owner/orders
 *
 * Optimized to 2 DB round-trips (down from 3):
 *   1. Restaurant IDs for this owner (fast, indexed)
 *   2. One big JOIN: orders + restaurants + orderItems + menuItems
 *      Produces one row per order-item; reassembled in JS.
 *
 * Saving one Tokyo round-trip ≈ -400ms vs the previous 3-query approach.
 */
export async function GET(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      await cancelExpiredPendingOrders().catch((err) => {
        console.error("[api/owner/orders GET] Failed to sweep expired orders:", err);
      });

      const { searchParams } = new URL(req.url);
      const scope = searchParams.get("scope") || "active"; // active | history
      const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
      const limit = scope === "history" 
        ? Math.min(parseInt(searchParams.get("limit") || "10"), 100)
        : 200; // High limit for active tickets
      const offset = (page - 1) * limit;
      const restaurantIdFilter = searchParams.get("restaurantId");
      const statusFilterParam = searchParams.get("status");

      // ── 1. Get the owner's restaurant IDs ──────────────────────────────────
      const ownerRestoCondition = eq(restaurants.ownerId, user.id);
      const ownedRestos = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(ownerRestoCondition);

      if (!ownedRestos.length) return ok({ orders: [], ownedRestaurantIds: [], pagination: { total: 0, page, limit } });

      const ownedRestaurantIds = ownedRestos.map((r) => r.id);

      // ── 1b. Build filter for orders ────────────────────────────────────────
      const orderConditions = [inArray(orders.restaurantId, ownedRestaurantIds)];
      if (restaurantIdFilter) {
        orderConditions.push(eq(orders.restaurantId, restaurantIdFilter));
      }

      if (scope === "active") {
        orderConditions.push(
          inArray(orders.status, [
            "PENDING", 
            "PENDING_CONFIRMATION", 
            "CONFIRMED", 
            "PAID", 
            "PREPARING", 
            "DISPATCH_REQUESTED", 
            "OUT_FOR_DELIVERY"
          ] as any)
        );
      } else if (scope === "history") {
        if (statusFilterParam && ["DELIVERED", "CANCELLED"].includes(statusFilterParam)) {
          orderConditions.push(eq(orders.status, statusFilterParam as any));
        } else {
          orderConditions.push(inArray(orders.status, ["DELIVERED", "CANCELLED"] as any));
        }
      }
      
      const orderWhere = and(...orderConditions);

      // ── 1c. Get Total Count & Stats ────────────────────────────────────────
      const [{ count }] = await db
        .select({ count: sql<number>`CAST(COUNT(*) AS INT)` })
        .from(orders)
        .where(orderWhere);

      // Only calculate historical stats if we are in history mode or it's needed
      let stats = { totalRevenue: 0, deliveredCount: 0, cancelledCount: 0 };
      if (scope === "history") {
        const [archiveStats] = await db
          .select({
            totalRevenue: sum(orders.totalAmount),
            deliveredCount: sql<number>`COUNT(CASE WHEN ${orders.status} = 'DELIVERED' THEN 1 END)`,
            cancelledCount: sql<number>`COUNT(CASE WHEN ${orders.status} = 'CANCELLED' THEN 1 END)`,
          })
          .from(orders)
          .where(and(inArray(orders.restaurantId, ownedRestaurantIds)));
        
        stats = {
          totalRevenue: parseFloat(archiveStats?.totalRevenue || "0"),
          deliveredCount: Number(archiveStats?.deliveredCount || 0),
          cancelledCount: Number(archiveStats?.cancelledCount || 0),
        };
      }

      // ── 1d. Fetch Paginated Order IDs ──────────────────────────────────────
      const paginatedOrderIdsRows = await db
        .select({ id: orders.id })
        .from(orders)
        .where(orderWhere)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(scope === "history" ? offset : 0); // No offset for active list usually

      if (!paginatedOrderIdsRows.length) {
        return ok({ 
          orders: [], 
          ownedRestaurantIds, 
          pagination: { total: count, page, limit } 
        });
      }

      const paginatedOrderIds = paginatedOrderIdsRows.map(o => o.id);

      // ── 2. Single JOIN for the Specific Orders ─────────────────────────────
      const rows = await db
        .select({
          // order fields
          orderId:         orders.id,
          userId:          orders.userId,
          restaurantId:    orders.restaurantId,
          restaurantName:  restaurants.name,
          status:          orders.status,
          totalAmount:     orders.totalAmount,
          deliveryFee:     orders.deliveryFee,
          deliveryAddress: orders.deliveryAddress,
          deliveryArea:    orders.deliveryArea,
          customerPhone:   orders.customerPhone,
          currency:        orders.currency,
          createdAt:       orders.createdAt,
          updatedAt:       orders.updatedAt,
          deliveryJobStatus: deliveryJobs.status,
          trackingUrl:     deliveryJobs.trackingUrl,
          driverName:      deliveryJobs.driverName,
          driverPhone:     deliveryJobs.driverPhone,
          eta:             deliveryJobs.eta,
          // order item fields (null when no items)
          itemId:          orderItems.id,
          itemMenuItemId:  orderItems.menuItemId,
          itemQuantity:    orderItems.quantity,
          itemPrice:       orderItems.price,
          itemName:        menuItems.name,
          itemImageUrl:    menuItems.imageUrl,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .leftJoin(deliveryJobs, eq(deliveryJobs.orderId, orders.id))
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(inArray(orders.id, paginatedOrderIds))
        .orderBy(desc(orders.createdAt));

      // ── 3. Reassemble denormalized rows → structured orders ────────────────
      const orderMap = new Map<string, {
        id: string; userId: string | null; restaurantId: string; status: string;
        totalAmount: string; deliveryFee: string; deliveryAddress: string | null;
        deliveryArea: string | null; customerPhone: string | null;
        currency: string; createdAt: Date; updatedAt: Date;
        deliveryJob?: {
          status: string | null;
          trackingUrl: string | null;
          driverName: string | null;
          driverPhone: string | null;
          eta: string | null;
        };
        restaurant: { name: string };
        items: { id: string; quantity: number; price: string; menuItem: { id: string; name: string; imageUrl: string | null } }[];
      }>();

      for (const row of rows) {
        if (!orderMap.has(row.orderId)) {
          orderMap.set(row.orderId, {
            id:              row.orderId,
            userId:          row.userId,
            restaurantId:    row.restaurantId,
            status:          row.status,
            totalAmount:     row.totalAmount,
            deliveryFee:     row.deliveryFee,
            deliveryAddress: row.deliveryAddress,
            deliveryArea:    row.deliveryArea,
            customerPhone:   row.customerPhone,
            currency:        row.currency,
            createdAt:       row.createdAt,
            updatedAt:       row.updatedAt,
            deliveryJob: row.deliveryJobStatus || row.trackingUrl || row.driverName || row.driverPhone || row.eta
              ? {
                  status: row.deliveryJobStatus,
                  trackingUrl: row.trackingUrl,
                  driverName: row.driverName,
                  driverPhone: row.driverPhone,
                  eta: row.eta,
                }
              : undefined,
            restaurant:      { name: row.restaurantName },
            items:           [],
          });
        }

        // Append item if this row has one (LEFT JOIN may produce nulls)
        if (row.itemId && row.itemMenuItemId) {
          orderMap.get(row.orderId)!.items.push({
            id:       row.itemId,
            quantity: row.itemQuantity!,
            price:    row.itemPrice!,
            menuItem: {
              id:       row.itemMenuItemId,
              name:     row.itemName ?? "",
              imageUrl: row.itemImageUrl ?? null,
            },
          });
        }
      }

      const result = Array.from(orderMap.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Ensure order after map reassembly

      return ok({ 
        orders: result, 
        ownedRestaurantIds,
        stats,
        pagination: {
          total: count,
          page,
          limit
        }
      });
    } catch (err) {
      console.error("[api/owner/orders GET]", err);
      return fail("Failed to fetch owner orders.", 500);
    }
  });
}
