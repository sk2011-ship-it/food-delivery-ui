import { fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { featuredItems, restaurants, menuItems } from "@/lib/db/schema";
import { eq, and, asc, SQL } from "drizzle-orm";

/* ── GET /api/featured ── */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const type     = searchParams.get("type") ?? "restaurant"; // default to restaurant
    const rId      = searchParams.get("restaurantId");

    if (!location) return fail("Location is required.", 400);

    const conditions: SQL[] = [
      eq(featuredItems.location, location),
      eq(featuredItems.status, "active"),
      eq(featuredItems.type, type as "restaurant" | "dish"),
    ];

    const where = and(...conditions);

    // If type is restaurant, join with restaurants
    if (type === "restaurant") {
      const rows = await db
        .select({
          id:        featuredItems.id,
          entityId:  featuredItems.entityId,
          type:      featuredItems.type,
          name:      restaurants.name,
          location:  restaurants.location,
          logoUrl:   restaurants.logoUrl,
          openingHours: restaurants.openingHours,
          sortOrder: featuredItems.sortOrder,
        })
        .from(featuredItems)
        .innerJoin(restaurants, eq(featuredItems.entityId, restaurants.id))
        .where(where)
        .orderBy(asc(featuredItems.sortOrder));

      return new Response(JSON.stringify({ data: { items: rows } }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // If type is dish, join with menuItems and restaurants
    // Optionally filter by restaurantId if passed (for the modal)
    const dishConditions: (SQL | undefined)[] = [where];
    if (rId) {
      dishConditions.push(eq(menuItems.restaurantId, rId));
    }

    const filteredDishConditions = dishConditions.filter((c): c is SQL => !!c);

    const rows = await db
      .select({
        id:             featuredItems.id,
        entityId:       featuredItems.entityId,
        type:           featuredItems.type,
        name:           menuItems.name,
        restaurantName: restaurants.name,
        restaurantId:   restaurants.id,
        openingHours:   restaurants.openingHours,
        price:          menuItems.price,
        imageUrl:       menuItems.imageUrl,
        category:       menuItems.category,
        sortOrder:      featuredItems.sortOrder,
      })
      .from(featuredItems)
      .innerJoin(menuItems, eq(featuredItems.entityId, menuItems.id))
      .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .where(and(...filteredDishConditions, eq(menuItems.status, "available")))
      .orderBy(asc(featuredItems.sortOrder));

    const items = rows.map(r => ({
      ...r,
      price: parseFloat(r.price as unknown as string),
    }));

    return new Response(JSON.stringify({ data: { items } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[api/featured GET]", err);
    return fail("Failed to load featured items.", 500);
  }
}
