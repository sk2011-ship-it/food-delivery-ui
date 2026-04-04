import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return fail("Unauthorized.", 401);
    }

    const conditions = [eq(restaurants.id, params.id)];
    if (user.role === "owner") {
      conditions.push(eq(restaurants.ownerId, user.id));
    }

    const [row] = await db
      .select()
      .from(restaurants)
      .where(and(...conditions))
      .limit(1);

    if (!row) return fail("Restaurant not found.", 404);

    return ok(row);
  } catch (err) {
    console.error(`[api/owner/restaurants/${params.id} GET]`, err);
    return fail("Failed to load restaurant details.", 500);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return fail("Unauthorized.", 401);
    }

    const body = await req.json();

    const conditions = [eq(restaurants.id, params.id)];
    if (user.role === "owner") {
      conditions.push(eq(restaurants.ownerId, user.id));
    }

    const [existing] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return fail("Restaurant not found or unauthorized.", 404);

    const [updated] = await db
      .update(restaurants)
      .set({
        name:          body.name,
        location:      body.location,
        logoUrl:       body.logoUrl,
        contactEmail:  body.contactEmail,
        contactPhone:  body.contactPhone,
        openingHours:  body.openingHours,
        updatedAt:     new Date(),
      })
      .where(eq(restaurants.id, params.id))
      .returning();

    return ok(updated);
  } catch (err) {
    console.error(`[api/owner/restaurants/${params.id} PUT]`, err);
    return fail("Failed to update restaurant.", 500);
  }
}
