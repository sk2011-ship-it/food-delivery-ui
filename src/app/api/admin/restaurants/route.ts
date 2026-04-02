import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";
import { eq, and, asc, desc, count, sql, SQL } from "drizzle-orm";

/* ── Zod schemas ── */
const DayHoursSchema    = z.object({ open: z.string(), close: z.string() }).nullable();
const OpeningHoursSchema = z.record(z.string(), DayHoursSchema).optional();

const CreateRestaurantSchema = z.object({
  name:          z.string().min(2).max(150),
  location:      z.string().max(100).optional().or(z.literal("")).transform(v => v || null),
  logoUrl:       z.string().url().optional().or(z.literal("")).transform(v => v || null),
  ownerId:       z.string().uuid(),
  managerPhone:  z.string().min(7).max(30).optional().or(z.literal("")).transform(v => v || null),
  contactEmail:  z.string().email(),
  contactPhone:  z.string().min(7).max(30),
  businessRegNo: z.string().max(100).optional().or(z.literal("")).transform(v => v || null),
  openingHours:  OpeningHoursSchema,
  status:        z.enum(["active", "inactive", "suspended"]).default("active"),
});

/* ── Shared select shape (restaurant + joined owner) ── */
const restaurantSelect = {
  id:            restaurants.id,
  name:          restaurants.name,
  location:      restaurants.location,
  logoUrl:       restaurants.logoUrl,
  ownerId:       restaurants.ownerId,
  ownerName:     users.name,
  ownerEmail:    users.email,
  ownerPhone:    users.phone,
  managerPhone:  restaurants.managerPhone,
  contactEmail:  restaurants.contactEmail,
  contactPhone:  restaurants.contactPhone,
  businessRegNo: restaurants.businessRegNo,
  openingHours:  restaurants.openingHours,
  status:        restaurants.status,
  createdAt:     restaurants.createdAt,
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)                 return { user: null, res: fail("Unauthorized.", 401) };
  if (user.role !== "admin") return { user: null, res: fail("Forbidden.", 403) };
  return { user, res: null };
}

/* ── GET /api/admin/restaurants ── */
export async function GET(req: Request) {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search")   ?? "";
    const status   = searchParams.get("status")   ?? "all";
    const location = searchParams.get("location") ?? "all";
    const sort     = searchParams.get("sort")     ?? "name";
    const order    = searchParams.get("order")    ?? "asc";
    const page     = Math.max(1, Number(searchParams.get("page")  ?? "1"));
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("limit") ?? "10")));
    const offset   = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (search) {
      const tsQuery = search
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w.replace(/[^a-zA-Z0-9]/g, "")}:*`)
        .filter(Boolean)
        .join(" & ");

      if (tsQuery) {
        conditions.push(
          sql`to_tsvector('simple', coalesce(${restaurants.name}, '') || ' ' || coalesce(${restaurants.contactEmail}, ''))
              @@ to_tsquery('simple', ${tsQuery})`
        );
      }
    }

    if (status !== "all") {
      conditions.push(eq(restaurants.status, status as "active" | "inactive" | "suspended"));
    }

    if (location !== "all") {
      conditions.push(eq(restaurants.location, location));
    }

    const where    = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol = sort === "createdAt" ? restaurants.createdAt : restaurants.name;
    const orderDir = order === "desc" ? desc(orderCol) : asc(orderCol);

    /* Run count + data fetch in parallel — saves one round-trip */
    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(restaurants).where(where),
      db
        .select(restaurantSelect)
        .from(restaurants)
        .leftJoin(users, eq(restaurants.ownerId, users.id))
        .where(where)
        .orderBy(orderDir)
        .limit(pageSize)
        .offset(offset),
    ]);

    return ok({ restaurants: rows, total: countRows[0].total, page, pageSize });
  } catch (err) {
    console.error("[admin/restaurants GET]", err);
    return fail("Failed to load restaurants.", 500);
  }
}

/* ── POST /api/admin/restaurants ── */
export async function POST(req: Request) {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    const parsed = await parseBody(req, CreateRestaurantSchema);
    if ("error" in parsed) return parsed.error;

    const { name, location, logoUrl, ownerId, managerPhone, contactEmail,
            contactPhone, businessRegNo, openingHours, status } = parsed.data;

    /* Verify owner exists and grab their info in one query */
    const [owner] = await db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, ownerId));

    if (!owner) return fail("Owner user not found.", 404);

    const [created] = await db
      .insert(restaurants)
      .values({ name, location, logoUrl, ownerId, managerPhone, contactEmail,
                contactPhone, businessRegNo, openingHours, status })
      .returning();

    /* Return the full shape the UI expects (same as GET list rows) */
    return ok({
      ...created,
      ownerName:  owner.name,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
    });
  } catch (err) {
    console.error("[admin/restaurants POST]", err);
    return fail("Failed to create restaurant.", 500);
  }
}
