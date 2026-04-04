import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, cartItems, menuItems } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/orders
 * Creates one or more orders from the current user's cart.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const userCartItems = await db
      .select({
        cartItemId: cartItems.id,
        menuItemId: cartItems.menuItemId,
        quantity: cartItems.quantity,
        price: menuItems.price,
        restaurantId: menuItems.restaurantId,
      })
      .from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .where(eq(cartItems.userId, user.id));

    if (userCartItems.length === 0) {
      return fail("Cart is empty", 400);
    }

    const itemsByRestaurant: Record<string, typeof userCartItems> = {};
    userCartItems.forEach((item) => {
      if (!itemsByRestaurant[item.restaurantId]) {
        itemsByRestaurant[item.restaurantId] = [];
      }
      itemsByRestaurant[item.restaurantId].push(item);
    });

    const createdOrders = [];

    for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
      const totalAmount = items.reduce((sum, item) => {
        return sum + (parseFloat(item.price as string) * item.quantity);
      }, 0);

      const [newOrder] = await db.insert(orders).values({
        userId: user.id,
        restaurantId,
        totalAmount: totalAmount.toFixed(2),
        status: "PENDING_CONFIRMATION",
      }).returning();

      await db.insert(orderItems).values(
        items.map(item => ({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: (parseFloat(item.price as string)).toFixed(2),
        }))
      );

      createdOrders.push(newOrder);
    }

    const cartItemIds = userCartItems.map(i => i.cartItemId);
    await db.delete(cartItems).where(inArray(cartItems.id, cartItemIds));

    return ok({ orders: createdOrders });
  } catch (err) {
    console.error("[api/orders POST]", err);
    return fail("Failed to create orders.", 500);
  }
}

/**
 * GET /api/orders
 * Fetches orders for the current customer.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const results = await db.select().from(orders).where(eq(orders.userId, user.id));
    return ok({ orders: results });
  } catch (err) {
    console.error("[api/orders GET]", err);
    return fail("Failed to fetch orders.", 500);
  }
}
