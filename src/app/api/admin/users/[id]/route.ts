import { z } from "zod";
import { parseBody, ok, fail, withAuth } from "@/lib/proxy";
import { invalidateUserCache } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

const UpdateUserSchema = z.object({
  name:   z.string().min(2).max(150).optional(),
  phone:  z.preprocess(
    (value) => normalizePhone(value),
    z.string().regex(/^\d{10,15}$/, "Phone number must be between 10 and 15 digits (numbers only).")
  ).optional(),
  role:   z.enum(["customer", "driver", "owner", "admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
});

/* ── PUT /api/admin/users/[id] ── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (admin: SessionUser) => {
    const { id } = await params;

    const parsed = await parseBody(req, UpdateUserSchema);
    if ("error" in parsed) return parsed.error;
    const updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      return fail("No fields to update.");
    }

    /* Prevent admin from banning themselves */
    if (id === admin.id && updates.status === "banned") {
      return fail("You cannot ban your own account.", 403);
    }

    /* Prevent admin from changing their own role */
    if (id === admin.id && updates.role && updates.role !== admin.role) {
      return fail("You cannot change your own role.", 403);
    }

    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) return fail("User not found.", 404);

    // Evict from cache — role/status change must take effect immediately.
    invalidateUserCache(id);

    return ok(updated);
  }, ["admin"]);
}

/* ── DELETE /api/admin/users/[id] ── */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (admin: SessionUser) => {
    const { id } = await params;

    /* Prevent admin from deleting themselves */
    if (id === admin.id) {
      return fail("You cannot delete your own account.", 403);
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!deleted) return fail("User not found.", 404);

    // Evict from cache — user no longer exists.
    invalidateUserCache(id);

    /* Also remove from Supabase Auth */
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(id).catch((err) => {
      console.error("[admin/users DELETE] auth delete failed:", err);
    });

    return ok({ id });
  }, ["admin"]);
}
