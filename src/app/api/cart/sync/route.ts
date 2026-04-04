import { ok, fail, parseBody } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const SyncSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
});

/**
 * POST /api/cart/sync
 * Merges a guest's localStorage cart into the logged-in user's DB cart.
 * Called automatically after login when guest cart items exist.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await parseBody(req, SyncSchema);
    if ("error" in body) return body.error;

    const { items } = body.data;

    for (const item of items) {
      // Check if this item already exists in their DB cart
      const [existing] = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, user.id), eq(cartItems.menuItemId, item.menuItemId)))
        .limit(1);

      if (existing) {
        // Merge quantities
        await db
          .update(cartItems)
          .set({
            quantity: existing.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existing.id));
      } else {
        // Insert new
        await db.insert(cartItems).values({
          userId: user.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        });
      }
    }

    return ok({ message: `Synced ${items.length} guest cart items` });
  } catch (err) {
    console.error("[api/cart/sync POST]", err);
    return fail("Failed to sync cart.", 500);
  }
}
