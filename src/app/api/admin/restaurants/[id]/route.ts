import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)                 return { user: null, res: fail("Unauthorized.", 401) };
  if (user.role !== "admin") return { user: null, res: fail("Forbidden.", 403) };
  return { user, res: null };
}

const DayHoursSchema = z.object({ open: z.string(), close: z.string() }).nullable();

const UpdateRestaurantSchema = z.object({
  name:          z.string().min(2).max(150).optional(),
  location:      z.string().max(100).optional().or(z.literal("")).transform(v => v || null),
  logoUrl:       z.string().url().optional().or(z.literal("")).transform(v => v || null),
  ownerId:       z.string().uuid().optional(),
  managerPhone:  z.string().min(7).max(30).optional().or(z.literal("")).transform(v => v || null),
  contactEmail:  z.string().email().optional(),
  contactPhone:  z.string().min(7).max(30).optional(),
  businessRegNo: z.string().max(100).optional().or(z.literal("")).transform(v => v || null),
  openingHours:  z.record(z.string(), DayHoursSchema).optional(),
  status:        z.enum(["active", "inactive", "suspended"]).optional(),
});

/* ── PUT /api/admin/restaurants/[id] ── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;

  const { id } = await params;

  const parsed = await parseBody(req, UpdateRestaurantSchema);
  if ("error" in parsed) return parsed.error;
  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    return fail("No fields to update.");
  }

  /* Verify new owner exists if changing */
  if (updates.ownerId) {
    const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.id, updates.ownerId));
    if (!owner) return fail("Owner user not found.", 404);
  }

  try {
    const [updated] = await db
      .update(restaurants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();

    if (!updated) return fail("Restaurant not found.", 404);
    return ok(updated);
  } catch (err) {
    console.error("[admin/restaurants PUT]", err);
    return fail("Failed to update restaurant.", 500);
  }
}

/* ── DELETE /api/admin/restaurants/[id] ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(restaurants)
      .where(eq(restaurants.id, id))
      .returning({ id: restaurants.id });

    if (!deleted) return fail("Restaurant not found.", 404);
    return ok({ id: deleted.id });
  } catch (err) {
    console.error("[admin/restaurants DELETE]", err);
    return fail("Failed to delete restaurant.", 500);
  }
}
