import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems, menuItems, restaurants } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

const BulkCartItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive().max(99),
});

const BulkCartSchema = z.object({
  items: z.array(BulkCartItemSchema).max(50),
});

/* ── POST /api/cart/bulk ── */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const res = await parseBody(req, BulkCartSchema);
      if ("error" in res) return res.error;

      const { items } = res.data;

      if (items.length === 0) {
        return ok({ items: [] });
      }

      const mergedItems = new Map<string, number>();
      for (const item of items) {
        mergedItems.set(item.menuItemId, (mergedItems.get(item.menuItemId) ?? 0) + item.quantity);
      }

      const uniqueMenuItemIds = [...mergedItems.keys()];
      const menuRows = await db
        .select({
          id: menuItems.id,
          status: menuItems.status,
          restaurantId: menuItems.restaurantId,
          openingHours: restaurants.openingHours,
          restaurantName: restaurants.name,
        })
        .from(menuItems)
        .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
        .where(inArray(menuItems.id, uniqueMenuItemIds));

      const menuRowById = new Map(menuRows.map((row) => [row.id, row]));

      for (const menuItemId of uniqueMenuItemIds) {
        const item = menuRowById.get(menuItemId);
        if (!item) return fail("Item not found.", 404);
        if (item.status !== "available") {
          return fail("One or more items are currently unavailable.", 400);
        }
        if (!isRestaurantOpen(item.openingHours)) {
          return fail(`${item.restaurantName} is currently closed and not accepting new orders.`, 400);
        }
      }

      const upsertRows = uniqueMenuItemIds.map((menuItemId) => ({
        userId: user.id,
        menuItemId,
        quantity: mergedItems.get(menuItemId) ?? 1,
      }));

      const insertedItems = await db.transaction(async (tx) => {
        await tx
          .delete(cartItems)
          .where(eq(cartItems.userId, user.id));

        await tx
          .insert(cartItems)
          .values(upsertRows);

        return tx
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
          .where(eq(cartItems.userId, user.id));
      });

      const formattedItems = insertedItems.map((item) => ({
        ...item,
        price: parseFloat(item.price as unknown as string),
      }));

      return ok({ items: formattedItems });
    } catch (err) {
      console.error("[api/cart/bulk POST]", err);
      return fail("Failed to replace cart.", 500);
    }
  });
}
