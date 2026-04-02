import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuItems, restaurants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)                 return { user: null, res: fail("Unauthorized.", 401) };
  if (user.role !== "admin") return { user: null, res: fail("Forbidden.", 403) };
  return { user, res: null };
}

const UpdateMenuItemSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  name:         z.string().min(1).max(150).optional(),
  description:  z.string().max(500).optional().or(z.literal("")).transform(v => v || null),
  category:     z.string().min(1).max(100).optional(),
  price:        z.number().positive().optional(),
  status:       z.enum(["available", "unavailable"]).optional(),
  imageUrl:     z.string().url().optional(),
});

/* ── PUT /api/admin/menu/[id] ── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;

  const { id } = await params;

  const parsed = await parseBody(req, UpdateMenuItemSchema);
  if ("error" in parsed) return parsed.error;

  const { price, ...rest } = parsed.data;
  const updates = { ...rest, ...(price !== undefined ? { price: String(price) } : {}) };

  if (Object.keys(updates).length === 0) return fail("No fields to update.");

  try {
    const [updated] = await db
      .update(menuItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();

    if (!updated) return fail("Menu item not found.", 404);

    /* Join restaurant info */
    const [restaurant] = await db
      .select({ name: restaurants.name, location: restaurants.location })
      .from(restaurants)
      .where(eq(restaurants.id, updated.restaurantId));

    return ok({
      ...updated,
      restaurantName:     restaurant?.name     ?? null,
      restaurantLocation: restaurant?.location ?? null,
      price:              parseFloat(updated.price as unknown as string),
    });
  } catch (err) {
    console.error("[admin/menu PUT]", err);
    return fail("Failed to update menu item.", 500);
  }
}

/* ── DELETE /api/admin/menu/[id] ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning({ id: menuItems.id });

    if (!deleted) return fail("Menu item not found.", 404);
    return ok({ id: deleted.id });
  } catch (err) {
    console.error("[admin/menu DELETE]", err);
    return fail("Failed to delete menu item.", 500);
  }
}
