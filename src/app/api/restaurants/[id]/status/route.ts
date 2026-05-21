import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fail } from "@/lib/proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurants/[id]/status
 * Returns only the fields needed to compute open/closed status.
 * Used by RestaurantMenuView to poll for live status changes.
 * No caching — always queries the DB directly.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [row] = await db
      .select({
        openingHours: restaurants.openingHours,
        isActive:     restaurants.isActive,
        status:       restaurants.status,
      })
      .from(restaurants)
      .where(eq(restaurants.id, id))
      .limit(1);

    if (!row) return fail("Not found.", 404);

    return new Response(
      JSON.stringify({
        openingHours: row.openingHours,
        isActive:     row.isActive,
        status:       row.status,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("[api/restaurants/[id]/status GET]", err);
    return fail("Failed to fetch restaurant status.", 500);
  }
}
