import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";
import { eq, and, SQL, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // Only owners and admins can access this route
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return fail("Unauthorized.", 401);
    }

    const conditions: SQL[] = [];
    
    // If it's an owner, they only see their own restaurants
    if (user.role === "owner") {
      conditions.push(eq(restaurants.ownerId, user.id));
    }
    // If it's an admin, they see everything

    const rows = await db
      .select({
        id:           restaurants.id,
        name:         restaurants.name,
        contactEmail: restaurants.contactEmail,
        contactPhone: restaurants.contactPhone,
        site:         restaurants.location, 
        ownerName:    users.name,
        status:       restaurants.status,
        createdAt:    restaurants.createdAt,
      })
      .from(restaurants)
      .leftJoin(users, eq(restaurants.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(restaurants.createdAt));

    return ok({ items: rows });
  } catch (err) {
    console.error("[api/owner/restaurants GET]", err);
    return fail("Failed to load restaurants.", 500);
  }
}
