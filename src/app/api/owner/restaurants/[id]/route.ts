import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    const { id } = await params;
    try {
      if (user.role !== "owner" && user.role !== "admin") {
        return fail("Unauthorized.", 401);
      }

    const conditions = [eq(restaurants.id, id)];
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
      console.error(`[api/owner/restaurants/${id} GET]`, err);
      return fail("Failed to load restaurant details.", 500);
    }
  }, ["owner", "admin"]);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    const { id } = await params;
    try {
      if (user.role !== "owner" && user.role !== "admin") {
        return fail("Unauthorized.", 401);
      }

    const body = await req.json();

    const conditions = [eq(restaurants.id, id)];
    if (user.role === "owner") {
      conditions.push(eq(restaurants.ownerId, user.id));
    }

    const [existing] = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        location: restaurants.location,
        logoUrl: restaurants.logoUrl,
        contactEmail: restaurants.contactEmail,
        contactPhone: restaurants.contactPhone,
        openingHours: restaurants.openingHours,
      })
      .from(restaurants)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return fail("Restaurant not found or unauthorized.", 404);

    const nextName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : existing.name;
    const nextLocation = typeof body.location === "string" && body.location.trim() ? body.location.trim() : existing.location;
    const nextLogoUrl = typeof body.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : existing.logoUrl;
    const nextContactEmail = typeof body.contactEmail === "string" && body.contactEmail.trim()
      ? body.contactEmail.trim()
      : existing.contactEmail;
    const nextContactPhone = typeof body.contactPhone === "string" && body.contactPhone.trim()
      ? body.contactPhone.trim()
      : existing.contactPhone;
    const nextOpeningHours = body.openingHours ?? existing.openingHours;

    const [updated] = await db
      .update(restaurants)
      .set({
        name:          nextName,
        location:      nextLocation,
        logoUrl:       nextLogoUrl,
        contactEmail:  nextContactEmail,
        contactPhone:  nextContactPhone,
        openingHours:  nextOpeningHours,
        updatedAt:     new Date(),
      })
      .where(eq(restaurants.id, id))
      .returning();

      return ok(updated);
    } catch (err) {
      console.error(`[api/owner/restaurants/${id} PUT]`, err);
      return fail("Failed to update restaurant.", 500);
    }
  }, ["owner", "admin"]);
}
