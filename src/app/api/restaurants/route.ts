import { fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, menuItems } from "@/lib/db/schema";
import { eq, and, SQL, sql, ilike } from "drizzle-orm";
import { normalizeLocationName } from "@/lib/locations";

/* ── GET /api/restaurants ── */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const category = searchParams.get("category");

    const normalizedLocation = normalizeLocationName(location);
    if (!normalizedLocation) return fail("Location is required.", 400);

    const conditions: SQL[] = [
      sql<boolean>`lower(trim(${restaurants.location})) = ${normalizedLocation}`,
      eq(restaurants.status, "active"),
      eq(restaurants.isActive, true),
    ];

    if (category) {
      // Join with menuItems to find restaurants that have at least one dish in this category
      const rows = await db
        .select({
          id:            restaurants.id,
          name:          restaurants.name,
          location:      restaurants.location,
          logoUrl:       restaurants.logoUrl,
          contactEmail:  restaurants.contactEmail,
          contactPhone:  restaurants.contactPhone,
          openingHours:  restaurants.openingHours,
        })
        .from(restaurants)
        .innerJoin(menuItems, eq(restaurants.id, menuItems.restaurantId))
        .where(and(...conditions, ilike(menuItems.category, category)))
        .groupBy(restaurants.id);

      return new Response(JSON.stringify({ data: { items: rows } }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const rows = await db
      .select({
        id:            restaurants.id,
        name:          restaurants.name,
        location:      restaurants.location,
        logoUrl:       restaurants.logoUrl,
        contactEmail:  restaurants.contactEmail,
        contactPhone:  restaurants.contactPhone,
        openingHours:  restaurants.openingHours,
      })
      .from(restaurants)
      .where(and(...conditions));

    return new Response(JSON.stringify({ data: { items: rows } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[api/restaurants GET]", err);
    return fail("Failed to load restaurants.", 500);
  }
}
