import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featuredItems, restaurants, menuItems } from "@/lib/db/schema";
import { eq, and, sql, desc, asc, count, SQL, inArray } from "drizzle-orm";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)                 return { user: null, res: fail("Unauthorized.", 401) };
  if (user.role !== "admin") return { user: null, res: fail("Forbidden.", 403) };
  return { user, res: null };
}

const CreateFeaturedSchema = z.object({
  type:      z.enum(["restaurant", "dish"]),
  entityId:  z.string().uuid(),
  location:  z.string().min(1).max(100),
  status:    z.enum(["active", "inactive"]).default("active"),
  sortOrder: z.number().int().default(0),
});

/* ── GET /api/admin/featured ── */
export async function GET(req: Request) {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") ?? "all";
    const type     = searchParams.get("type")     ?? "all";
    const status   = searchParams.get("status")   ?? "all";
    const page     = Math.max(1, Number(searchParams.get("page")  ?? "1"));
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("limit") ?? "20")));
    const offset   = (page - 1) * pageSize;

    const conditions: SQL[] = [];
    if (location !== "all") conditions.push(eq(featuredItems.location, location));
    if (type     !== "all") conditions.push(eq(featuredItems.type,     type as "restaurant" | "dish"));
    if (status   !== "all") conditions.push(eq(featuredItems.status,   status as "active" | "inactive"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(featuredItems).where(where),
      db
        .select({
          id:        featuredItems.id,
          type:      featuredItems.type,
          entityId:  featuredItems.entityId,
          location:  featuredItems.location,
          status:    featuredItems.status,
          sortOrder: featuredItems.sortOrder,
          createdAt: featuredItems.createdAt,
          // We'll join names manually or via subqueries/conditional joins if possible, 
          // but Drizzle joins with different tables for the same column is tricky.
          // Easier to fetch names in a second pass or use a raw SQL subquery.
        })
        .from(featuredItems)
        .where(where)
        .orderBy(desc(featuredItems.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    // Enhance rows with entity names using bulk lookups (N+1 query fix)
    const restaurantIds = Array.from(new Set(rows.filter(r => r.type === "restaurant").map(r => r.entityId)));
    const dishIds       = Array.from(new Set(rows.filter(r => r.type === "dish").map(r => r.entityId)));

    const [restaurantNames, dishNames] = await Promise.all([
      restaurantIds.length > 0 
        ? db.select({ id: restaurants.id, name: restaurants.name }).from(restaurants).where(inArray(restaurants.id, restaurantIds))
        : Promise.resolve([]),
      dishIds.length > 0
        ? db.select({ id: menuItems.id, name: menuItems.name }).from(menuItems).where(inArray(menuItems.id, dishIds))
        : Promise.resolve([]),
    ]);

    const nameMap = new Map<string, string>();
    restaurantNames.forEach(r => nameMap.set(r.id, r.name));
    dishNames.forEach(d => nameMap.set(d.id, d.name));

    const enhancedRows = rows.map(row => ({
      ...row,
      entityName: nameMap.get(row.entityId) || "Unknown",
    }));

    return ok({ items: enhancedRows, total: countRows[0].total, page, pageSize });
  } catch (err) {
    console.error("[admin/featured GET]", err);
    return fail("Failed to load featured items.", 500);
  }
}

/* ── POST /api/admin/featured ── */
export async function POST(req: Request) {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    const parsed = await parseBody(req, CreateFeaturedSchema);
    if ("error" in parsed) return parsed.error;

    const { type, entityId, location, status, sortOrder } = parsed.data;

    // Verify entity exists
    let entityName = "";
    if (type === "restaurant") {
      const [r] = await db.select({ name: restaurants.name }).from(restaurants).where(eq(restaurants.id, entityId));
      if (!r) return fail("Restaurant not found.", 404);
      entityName = r.name;
    } else {
      const [m] = await db.select({ name: menuItems.name }).from(menuItems).where(eq(menuItems.id, entityId));
      if (!m) return fail("Menu item not found.", 404);
      entityName = m.name;
    }

    // Check for duplicate
    const [existing] = await db
      .select({ id: featuredItems.id })
      .from(featuredItems)
      .where(and(
        eq(featuredItems.type, type),
        eq(featuredItems.entityId, entityId),
        eq(featuredItems.location, location)
      ));
    
    if (existing) return fail("This item is already featured in this location.", 409);

    const [created] = await db
      .insert(featuredItems)
      .values({ type, entityId, location, status, sortOrder })
      .returning();

    return ok({ ...created, entityName });
  } catch (err) {
    console.error("[admin/featured POST]", err);
    return fail("Failed to create featured item.", 500);
  }
}
