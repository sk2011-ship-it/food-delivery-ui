import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems, menuItems } from "@/lib/db/schema";
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
        await db.insert(cartItems)
          .values(items.map(item => ({
            userId: user.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })))
          .onConflictDoUpdate({
            target: [cartItems.userId, cartItems.menuItemId],
            set: {
              quantity: sql`${cartItems.quantity} + excluded.quantity`,
              updatedAt: new Date(),
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
