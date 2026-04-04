import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

/* ── POST /api/cart/clear ── */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    await db
      .delete(cartItems)
      .where(eq(cartItems.userId, user.id));

    return ok({ message: "Cart cleared" });
  } catch (err) {
    console.error("[api/cart/clear POST]", err);
    return fail("Failed to clear cart.", 500);
  }
}
