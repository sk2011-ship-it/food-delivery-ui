import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { menuItems, restaurants, featuredItems } from "@/lib/db/schema";
import { eq, and, ilike, SQL, desc, sql } from "drizzle-orm";

/* ── GET /api/dishes ── */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "";
    const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));

    if (!location) return fail("Location is required.", 400);

    const conditions: SQL[] = [
      eq(restaurants.location, location),
      eq(menuItems.status, "available"),
    ];

    if (search) {
      conditions.push(ilike(menuItems.name, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(menuItems.category, category));
    }

    const rows = await db
      .select({
        id:                 menuItems.id,
        restaurantId:       menuItems.restaurantId,
        restaurantName:     restaurants.name,
        restaurantLocation: restaurants.location,
        name:               menuItems.name,
        description:        menuItems.description,
        category:           menuItems.category,
        price:              menuItems.price,
        status:             menuItems.status,
        imageUrl:           menuItems.imageUrl,
        createdAt:          menuItems.createdAt,
        isFeatured:         sql<boolean>`CASE WHEN ${featuredItems.id} IS NOT NULL THEN true ELSE false END`.as("is_featured"),
      })
      .from(menuItems)
      .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .leftJoin(featuredItems, and(
        eq(featuredItems.entityId, menuItems.id), 
        eq(featuredItems.type, 'dish'), 
        eq(featuredItems.status, 'active')
      ))
      .where(and(...conditions))
      .orderBy(desc(sql`is_featured`))
      .limit(limit);

    const items = rows.map((r) => ({
      ...r,
      price: parseFloat(r.price as unknown as string),
    }));

    return ok({ items });
  } catch (err) {
    console.error("[api/dishes GET]", err);
    return fail("Failed to load dishes.", 500);
  }
}
