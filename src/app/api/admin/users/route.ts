import { z } from "zod";
import { parseBody, ok, fail, withAuth } from "@/lib/proxy";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, asc, desc, count, sql, SQL } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";

const CreateUserSchema = z.object({
  name:     z.string().min(2).max(150),
  email:    z.string().email(),
  phone:    z.preprocess(
    (value) => normalizePhone(value),
    z.string().regex(/^\d{10,15}$/, "Phone number must be between 10 and 15 digits (numbers only).")
  ),
  role:     z.enum(["customer", "driver", "owner", "admin"]),
  password: z.string().min(8).max(72),
});

/* ── GET /api/admin/users ── */
export async function GET(req: Request) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search")   ?? "";
    const role     = searchParams.get("role")     ?? "all";
    const status   = searchParams.get("status")   ?? "all";
    const sort     = searchParams.get("sort")     ?? "name";
    const order    = searchParams.get("order")    ?? "asc";
    const page     = Math.max(1, Number(searchParams.get("page")  ?? "1"));
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("limit") ?? "10")));
    const offset   = (page - 1) * pageSize;

    /* Build WHERE conditions */
    const conditions: SQL[] = [];
    if (search) {
      /*
       * Full Text Search using PostgreSQL tsvector.
       * Each whitespace-separated token gets a :* prefix-match suffix so
       * typing "joh smi" matches "John Smith" before the user finishes typing.
       * Backed by a GIN expression index — far faster than ILIKE '%…%'.
       */
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
    if (role !== "all") {
      conditions.push(eq(users.role, role as "customer" | "driver" | "owner" | "admin"));
    }
    if (status !== "all") {
      conditions.push(eq(users.status, status as "active" | "banned"));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    /* Sort */
    const orderCol = sort === "createdAt" ? users.createdAt : users.name;
    const orderDir = order === "desc" ? desc(orderCol) : asc(orderCol);

    /* Run count + rows in parallel */
    const [[{ total }], rows] = await Promise.all([
      db.select({ total: count() }).from(users).where(where),
      db
        .select({
          id:        users.id,
          name:      users.name,
          email:     users.email,
          phone:     users.phone,
          role:      users.role,
          status:    users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(orderDir)
        .limit(pageSize)
        .offset(offset),
    ]);

    return ok({ users: rows, total, page, pageSize });
  }, ["admin"]);
}

/* ── POST /api/admin/users ── */
export async function POST(req: Request) {
  return withAuth(req, async () => {
    const parsed = await parseBody(req, CreateUserSchema);
    if ("error" in parsed) return parsed.error;
    const { name, email, phone, role, password } = parsed.data;

    const adminClient = createAdminClient();

    /* Create auth user — bypasses email confirmation */
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
      console.error("[admin/users POST] auth error:", authErr?.message);
      return fail("Failed to create auth user.", 500);
    }

    const userId = authData.user.id;

    try {
      const [created] = await db
        .insert(users)
        .values({ id: userId, name, email, phone, role, status: "active" })
        .returning();

      return ok(created);
    } catch (err) {
      console.error("[admin/users POST] db insert failed:", err);
      await adminClient.auth.admin.deleteUser(userId).catch(() => null);
      return fail("Failed to save user. Please try again.", 500);
    }
  }, ["admin"]);
}
