import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { menuItems, restaurants } from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { isLikelyImageUrl, normalizeImageUrl } from "@/lib/image";

/* ── GET /api/owner/menu ── */
export async function GET(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      /* 1. Get all restaurants owned by the user */
      const ownedRests = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.ownerId, user.id));

      if (!ownedRests.length) return ok({ items: [] });

      const ownedIds = ownedRests.map(r => r.id);

      /* 2. Get menu items for these restaurants */
      const rows = await db
        .select({
          id:                 menuItems.id,
          restaurantId:       menuItems.restaurantId,
          restaurantName:     restaurants.name,
          name:               menuItems.name,
          description:        menuItems.description,
          category:           menuItems.category,
          price:              menuItems.price,
          status:             menuItems.status,
          imageUrl:           menuItems.imageUrl,
          createdAt:          menuItems.createdAt,
        })
        .from(menuItems)
        .leftJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
        .where(inArray(menuItems.restaurantId, ownedIds))
        .orderBy(asc(menuItems.createdAt));

      const items = rows.map((r) => ({
        ...r,
        price: parseFloat(r.price as unknown as string),
      }));

      return ok({ items });
    } catch (err) {
      console.error("[owner/menu GET]", err);
      return fail("Failed to load your menu items.", 500);
    }
  });
}

/* ── POST /api/owner/menu ── */
export async function POST(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      const body = await req.json();
      const { restaurantId, name, description, category, price, status } = body;
      const imageUrl = normalizeImageUrl(body.imageUrl);

      // Manual Validation
      if (!restaurantId || !name || !category || !price || !imageUrl) {
        return fail("Missing required fields.", 400);
      }
      if (!isLikelyImageUrl(imageUrl)) {
        return fail("Please provide a valid image URL.", 400);
      }

      /* 1. Verify user owns the restaurant */
      const [restaurant] = await db
        .select({ id: restaurants.id, name: restaurants.name })
        .from(restaurants)
        .where(and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, user.id)));

      if (!restaurant) return fail("Restaurant not found or permission denied.", 403);

      /* 2. Insert item */
      const [created] = await db
        .insert(menuItems)
        .values({ 
          restaurantId, 
          name, 
          description, 
          category, 
          price: String(price), 
          status: status || "ACTIVE", 
          imageUrl 
        })
        .returning();

      return ok({
        ...created,
        restaurantName: restaurant.name,
        price:          parseFloat(created.price as unknown as string),
      });
    } catch (err) {
      console.error("[owner/menu POST]", err);
      return fail("Failed to create menu item.", 500);
    }
  });
}
