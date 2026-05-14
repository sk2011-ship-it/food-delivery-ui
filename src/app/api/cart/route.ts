import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems, menuItems, restaurants } from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { z } from "zod";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

const AddToCartSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

/* ── GET /api/cart ── */
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const items = await db
        .select({
          id: cartItems.id,
          menuItemId: cartItems.menuItemId,
          quantity: cartItems.quantity,
          name: menuItems.name,
          price: menuItems.price,
          imageUrl: menuItems.imageUrl,
          restaurantName: restaurants.name,
          restaurantId: restaurants.id,
          restaurantLocation: restaurants.location,
          restaurantLat: restaurants.latitude,
          restaurantLng: restaurants.longitude,
          openingHours: restaurants.openingHours,
        })
        .from(cartItems)
        .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
        .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
        .where(and(eq(cartItems.userId, user.id), isNull(restaurants.deletionStatus)));

      // Convert numeric price to number
      const formattedItems = items.map(item => ({
        ...item,
        price: parseFloat(item.price as unknown as string),
      }));

      return ok({ items: formattedItems });
    } catch (err) {
      console.error("[api/cart GET]", err);
      return fail("Failed to fetch cart items.", 500);
    }
  });
}

/* ── POST /api/cart ── */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const res = await parseBody(req, AddToCartSchema);
      if ("error" in res) return res.error;
      const { menuItemId, quantity } = res.data;

      /* 1. Verify item exists and is available */
      const [item] = await db
        .select({ 
          id: menuItems.id, 
          status: menuItems.status,
          restaurantId: menuItems.restaurantId,
          openingHours: restaurants.openingHours,
          restaurantName: restaurants.name
        })
        .from(menuItems)
        .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
        .where(and(eq(menuItems.id, menuItemId), isNull(restaurants.deletionStatus)));

      if (!item) return fail("Item not found.", 404);
      if (item.status !== "available") return fail("This item is currently unavailable.", 400);

      // Validate Restaurant Operational Hours
      if (!isRestaurantOpen(item.openingHours)) {
        return fail(`${item.restaurantName} is currently closed and not accepting new orders.`, 400);
      }

      // Attempt an atomic update first
      const [updated] = await db
        .update(cartItems)
        .set({ 
          quantity: sql`${cartItems.quantity} + ${quantity}`,
          updatedAt: new Date(),
        })
        .where(and(eq(cartItems.userId, user.id), eq(cartItems.menuItemId, menuItemId)))
        .returning();

      if (updated) {
        return ok({ item: updated });
      }

      // If not updated, insert new item
      const [inserted] = await db
        .insert(cartItems)
        .values({
          userId: user.id,
          menuItemId,
          quantity,
        })
        .returning();

      return ok({ item: inserted });
    } catch (err) {
      console.error("[api/cart POST]", err);
      return fail("Failed to update cart.", 500);
    }
  });
}
