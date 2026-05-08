import { fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { menuItems, restaurants, featuredItems } from "@/lib/db/schema";
import { eq, and, ilike, SQL, desc, sql } from "drizzle-orm";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { normalizeLocationName } from "@/lib/locations";
import type { OpeningHours } from "@/lib/api";

/* ── GET /api/dishes ── */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));

    const normalizedLocation = normalizeLocationName(location);
    if (!normalizedLocation) return fail("Location is required.", 400);

    const conditions: SQL[] = [
      sql<boolean>`lower(trim(${restaurants.location})) = ${normalizedLocation}`,
      eq(menuItems.status, "available"),
      eq(restaurants.isActive, true), // Only active restaurants
    ];

    if (search) {
      conditions.push(ilike(menuItems.name, `%${search}%`));
    }
    if (category) {
      conditions.push(ilike(menuItems.category, category));
    }

    const rows = await db
      .select({
        id: menuItems.id,
        restaurantId: menuItems.restaurantId,
        restaurantName: restaurants.name,
        restaurantLocation: restaurants.location,
        restaurantOpeningHours: restaurants.openingHours,
        name: menuItems.name,
        description: menuItems.description,
        category: menuItems.category,
        price: menuItems.price,
        status: menuItems.status,
        imageUrl: menuItems.imageUrl,
        createdAt: menuItems.createdAt,
        isFeatured: sql<boolean>`CASE WHEN ${featuredItems.id} IS NOT NULL THEN true ELSE false END`.as("is_featured"),
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
      .limit(limit * 2); // Fetch more to allow for filtering closed ones

    const items = rows
      .filter((r) => isRestaurantOpen(r.restaurantOpeningHours as OpeningHours | null | undefined))
      .map((r) => ({
        ...r,
        price: parseFloat(r.price as unknown as string),
      }))
      .slice(0, limit);


    return new Response(JSON.stringify({ data: { items } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[api/dishes GET]", err);
    return fail("Failed to load dishes.", 500);
  }
}
