import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuItems, restaurants } from "@/lib/db/schema";
import { eq, and, ilike, count, asc, SQL } from "drizzle-orm";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)                 return { user: null, res: fail("Unauthorized.", 401) };
  if (user.role !== "admin") return { user: null, res: fail("Forbidden.", 403) };
  return { user, res: null };
}

const CreateMenuItemSchema = z.object({
  restaurantId: z.string().uuid(),
  name:         z.string().min(1).max(150),
  description:  z.string().max(500).optional().or(z.literal("")).transform(v => v || null),
  category:     z.string().min(1).max(100),
  price:        z.number().positive(),
  status:       z.enum(["available", "unavailable"]).default("available"),
  imageUrl:     z.string().url(),
});

/* ── GET /api/admin/menu ── */
export async function GET(req: Request) {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    const { searchParams } = new URL(req.url);
    const search       = searchParams.get("search")       ?? "";
    const restaurantId = searchParams.get("restaurantId") ?? "";
    const status       = searchParams.get("status")       ?? "all";
    const page         = Math.max(1, Number(searchParams.get("page")  ?? "1"));
    const pageSize     = Math.min(200, Math.max(10, Number(searchParams.get("limit") ?? "100")));
    const offset       = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(ilike(menuItems.name, `%${search}%`));
    }
    if (restaurantId) {
      conditions.push(eq(menuItems.restaurantId, restaurantId));
    }
    if (status !== "all") {
      conditions.push(eq(menuItems.status, status as "available" | "unavailable"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(menuItems).where(where),
      db
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
        })
        .from(menuItems)
        .leftJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
        .where(where)
        .orderBy(asc(menuItems.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const items = rows.map((r) => ({
      ...r,
      price: parseFloat(r.price as unknown as string),
    }));

    return ok({ items, total: countRows[0].total, page, pageSize });
  } catch (err) {
    console.error("[admin/menu GET]", err);
    return fail("Failed to load menu items.", 500);
  }
}

/* ── POST /api/admin/menu ── */
export async function POST(req: Request) {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    const parsed = await parseBody(req, CreateMenuItemSchema);
    if ("error" in parsed) return parsed.error;

    const { restaurantId, name, description, category, price, status, imageUrl } = parsed.data;

    /* Verify restaurant exists */
    const [restaurant] = await db
      .select({ id: restaurants.id, name: restaurants.name, location: restaurants.location })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));

    if (!restaurant) return fail("Restaurant not found.", 404);

    const [created] = await db
      .insert(menuItems)
      .values({ restaurantId, name, description, category, price: String(price), status, imageUrl })
      .returning();

    return ok({
      ...created,
      restaurantName:     restaurant.name,
      restaurantLocation: restaurant.location ?? null,
      price:              parseFloat(created.price as unknown as string),
    });
  } catch (err) {
    console.error("[admin/menu POST]", err);
    return fail("Failed to create menu item.", 500);
  }
}
