import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { sql, and, eq } from "drizzle-orm";
import { z } from "zod";

const SyncSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive().max(99),
  })).max(50),
});

/**
 * POST /api/cart/sync
 * Merges a guest's localStorage cart into the logged-in user's DB cart.
 * Called automatically after login when guest cart items exist.
 */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const body = await parseBody(req, SyncSchema);
      if ("error" in body) return body.error;

      const { items } = body.data;
      let syncedCount = 0;

      if (items.length > 0) {
        const mergedItems = new Map<string, number>();

        for (const item of items) {
          mergedItems.set(item.menuItemId, (mergedItems.get(item.menuItemId) ?? 0) + item.quantity);
        }

        await db.transaction(async (tx) => {
          for (const [menuItemId, quantity] of mergedItems.entries()) {
            const [updated] = await tx
              .update(cartItems)
              .set({
                quantity: sql`${cartItems.quantity} + ${quantity}`,
                updatedAt: new Date(),
              })
              .where(and(eq(cartItems.userId, user.id), eq(cartItems.menuItemId, menuItemId)))
              .returning();

            if (!updated) {
              await tx.insert(cartItems).values({
                userId: user.id,
                menuItemId,
                quantity,
              });
            }
          }
        });

        syncedCount = items.length;
      }

      return ok({ message: `Synced ${syncedCount} guest cart items` });
    } catch (err) {
      console.error("[api/cart/sync POST]", err);
      return fail("Failed to sync cart.", 500);
    }
  });
}
