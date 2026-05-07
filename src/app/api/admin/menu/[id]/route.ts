import { z } from "zod";
import { parseBody, ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { menuItems, restaurants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLikelyImageUrl, normalizeImageUrl } from "@/lib/image";

const UpdateMenuItemSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  name:         z.string().min(1).max(150).optional(),
  description:  z.string().max(500).optional().or(z.literal("")).transform(v => v || null),
  category:     z.string().min(1).max(100).optional(),
  price:        z.number().positive().optional(),
  status:       z.enum(["available", "unavailable"]).optional(),
  imageUrl:     z.string().transform(normalizeImageUrl).refine((value) => !value || isLikelyImageUrl(value), {
    message: "Please provide a valid image URL.",
  }).optional(),
});

/* ── PUT /api/admin/menu/[id] ── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOwnerAuth(req, async () => {
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
  });
}

/* ── DELETE /api/admin/menu/[id] ── */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOwnerAuth(req, async () => {
    const { id } = await params;

    try {
      const [updated] = await db
        .update(menuItems)
        .set({ status: "unavailable", updatedAt: new Date() })
        .where(eq(menuItems.id, id))
        .returning({ id: menuItems.id });

      if (!updated) return fail("Menu item not found.", 404);
      return ok({ id: updated.id, status: "unavailable" });
    } catch (err) {
      console.error("[admin/menu DELETE]", err);
      return fail("Failed to mark menu item as unavailable.", 500);
    }
  });
}
