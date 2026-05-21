import { z } from "zod";
import { parseBody, ok, fail, withAuth } from "@/lib/proxy";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, asc, desc, count, sql, SQL } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";
import { createShipdayCarrier } from "@/lib/shipday";

const CreateDriverSchema = z.object({
  name:     z.string().min(2).max(150),
  email:    z.string().email(),
  phone:    z.preprocess(
    (v) => normalizePhone(v),
    z.string().regex(/^\+?\d{10,15}$/, "Phone must be 10–15 digits with optional leading +.")
  ),
  password: z.string().min(8).max(72),
});

/* ── GET /api/admin/drivers ── */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search")  ?? "";
    const sort     = searchParams.get("sort")    ?? "name";
    const order    = searchParams.get("order")   ?? "asc";
    const page     = Math.max(1, Number(searchParams.get("page")  ?? "1"));
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("limit") ?? "20")));
    const offset   = (page - 1) * pageSize;

    const conditions: SQL[] = [eq(users.role, "driver")];

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
          sql`to_tsvector('simple', coalesce(${users.name}, '') || ' ' || coalesce(${users.email}, ''))
              @@ to_tsquery('simple', ${tsQuery})`
        );
      }
    }

    const where = and(...conditions);
    const orderCol = sort === "createdAt" ? users.createdAt : users.name;
    const orderDir = order === "desc" ? desc(orderCol) : asc(orderCol);

    const [[{ total }], rows] = await Promise.all([
      db.select({ total: count() }).from(users).where(where),
      db
        .select({
          id:               users.id,
          name:             users.name,
          email:            users.email,
          phone:            users.phone,
          status:           users.status,
          shipdayCarrierId: users.shipdayCarrierId,
          createdAt:        users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(orderDir)
        .limit(pageSize)
        .offset(offset),
    ]);

    return ok({ drivers: rows, total, page, pageSize });
  }, ["admin"]);
}

/* ── POST /api/admin/drivers ── */
export async function POST(req: Request) {
  return withAuth(req, async () => {
    const parsed = await parseBody(req, CreateDriverSchema);
    if ("error" in parsed) return parsed.error;
    const { name, email, phone, password } = parsed.data;

    const adminClient = createAdminClient();

    // 1. Create auth user in Supabase
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (authErr || !authData.user) {
      if (authErr?.message?.toLowerCase().includes("already")) {
        return fail("A user with this email already exists.", 409);
      }
      console.error("[admin/drivers POST] auth error:", authErr?.message);
      return fail("Failed to create auth user.", 500);
    }

    const userId = authData.user.id;
    let shipdayCarrierId: string | null = null;
    let shipdayPassword: string | null = null;

    // 2. Create driver in Shipday
    try {
      const carrier = await createShipdayCarrier({ name, email, phoneNumber: phone });
      shipdayCarrierId = String(carrier.carrierId);
      shipdayPassword  = carrier.password;
      console.log(`[admin/drivers] Shipday carrier created: ${carrier.carrierId} for ${email}`);
    } catch (shipdayErr) {
      // Roll back Supabase user if Shipday fails
      await adminClient.auth.admin.deleteUser(userId).catch(() => null);
      console.error("[admin/drivers POST] Shipday error:", shipdayErr);
      return fail("Failed to create driver in Shipday. Please try again.", 502);
    }

    // 3. Insert into our DB
    try {
      const [created] = await db
        .insert(users)
        .values({ id: userId, name, email, phone, role: "driver", status: "active", shipdayCarrierId })
        .returning();

      return ok({ driver: created, shipdayPassword });
    } catch (dbErr) {
      console.error("[admin/drivers POST] db insert failed:", dbErr);
      await adminClient.auth.admin.deleteUser(userId).catch(() => null);
      return fail("Failed to save driver. Please try again.", 500);
    }
  }, ["admin"]);
}
