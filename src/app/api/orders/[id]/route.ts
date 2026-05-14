import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, menuItems, restaurants, deliveryJobs } from "@/lib/db/schema";
import { eq, and, or, sql as drizzleSql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/[id]
 * Fetches a single order with its items and restaurant details.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;

      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantName: restaurants.name,
          status: orders.status,
          totalAmount: orders.totalAmount,
          deliveryFee: orders.deliveryFee,
          deliveryAddress: orders.deliveryAddress,
          deliveryArea: orders.deliveryArea,
          customerPhone: orders.customerPhone,
          currency: orders.currency,
          paymentIntentId: orders.paymentIntentId,
          sessionId: orders.sessionId,
          restaurantNameSnapshot: orders.restaurantNameSnapshot,
          deliveryJobStatus: deliveryJobs.status,
          trackingUrl: deliveryJobs.trackingUrl,
          driverName: deliveryJobs.driverName,
          driverPhone: deliveryJobs.driverPhone,
          eta: deliveryJobs.eta,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .leftJoin(deliveryJobs, eq(deliveryJobs.orderId, orders.id))
        .where(
          and(
            eq(orders.id, id),
            or(
              eq(orders.userId, user.id),
              eq(restaurants.ownerId, user.id),
              drizzleSql`${user.role} = 'admin'`
            )
          )
        )
        .limit(1);

      if (!order) {
        console.warn(`[api/orders/[id] GET] Order ${id} not found for user ${user.id}. Query: id=${id}, userId=${user.id}`);
        return fail("Order not found", 404);
      }

      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          price: orderItems.price,
          menuItemId: orderItems.menuItemId,
          itemName: menuItems.name,
          itemImageUrl: menuItems.imageUrl,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, id));

      const result = {
        ...order,
        restaurant: { name: order.restaurantNameSnapshot || order.restaurantName },
        deliveryJob: order.deliveryJobStatus || order.trackingUrl || order.driverName || order.driverPhone || order.eta
          ? {
              status: order.deliveryJobStatus,
              trackingUrl: order.trackingUrl,
              driverName: order.driverName,
              driverPhone: order.driverPhone,
              eta: order.eta,
            }
          : undefined,
        items: items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          price: i.price,
          menuItem: { id: i.menuItemId, name: i.itemName, imageUrl: i.itemImageUrl },
        })),
      };

      return ok(result);
    } catch (err) {
      console.error("[api/orders/[id] GET]", err);
      return fail("Failed to fetch order.", 500);
    }
  });
}
