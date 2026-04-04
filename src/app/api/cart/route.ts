import { ok, fail, parseBody } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems, menuItems, restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const AddToCartSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

/* ── GET /api/cart ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const items = await db
      .select({
        id: cartItems.id,
        menuItemId: cartItems.menuItemId,
        quantity: cartItems.quantity,
        name: menuItems.name,
        price: menuItems.price,
        imageUrl: menuItems.imageUrl,
        restaurantName: restaurants.name,
        restaurantId: restaurants.id,
      })
      .from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .where(eq(cartItems.userId, user.id));

    // Convert numeric price to number
    const formattedItems = items.map(item => ({
      ...item,
      price: parseFloat(item.price as unknown as string),
    }));

    return ok({ items: formattedItems });
  } catch (err) {
    console.error("[api/cart GET]", err);
    return fail("Failed to fetch cart items.", 500);
  }
}

/* ── POST /api/cart ── */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const res = await parseBody(req, AddToCartSchema);
    if ("error" in res) return res.error;
    const { menuItemId, quantity } = res.data;

    // Check if item already in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, user.id), eq(cartItems.menuItemId, menuItemId)))
      .limit(1);

    if (existing) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({ 
          quantity: existing.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return ok({ item: updated });
    } else {
      // Insert new item
      const [inserted] = await db
        .insert(cartItems)
        .values({
          userId: user.id,
          menuItemId,
          quantity,
        })
        .returning();
      return ok({ item: inserted });
    }
  } catch (err) {
    console.error("[api/cart POST]", err);
    return fail("Failed to update cart.", 500);
  }
}
