import { ok, fail, parseBody } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const UpdateQuantitySchema = z.object({
  quantity: z.number().int().min(0),
});

/* ── PATCH /api/cart/[itemId] ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const { itemId: menuItemId } = await params;
    const body = await parseBody(req, UpdateQuantitySchema);
    if ("error" in body) return body.error;
    const { quantity } = body.data;

    if (quantity === 0) {
      await db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.userId, user.id),
            eq(cartItems.menuItemId, menuItemId)
          )
        );
      return ok({ message: "Item removed from cart" });
    } else {
      await db
        .update(cartItems)
        .set({ 
          quantity,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cartItems.userId, user.id),
            eq(cartItems.menuItemId, menuItemId)
          )
        );
      return ok({ message: "Quantity updated" });
    }
  } catch (err) {
    console.error("[api/cart PATCH]", err);
    return fail("Failed to update cart.", 500);
  }
}

/* ── DELETE /api/cart/[itemId] ── */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const { itemId: menuItemId } = await params;

    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.userId, user.id),
          eq(cartItems.menuItemId, menuItemId)
        )
      );

    return ok({ message: "Item removed from cart" });
  } catch (err) {
    console.error("[api/cart DELETE]", err);
    return fail("Failed to remove item from cart.", 500);
  }
}
