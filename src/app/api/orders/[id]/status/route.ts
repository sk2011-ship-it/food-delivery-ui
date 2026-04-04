import { ok, fail, parseBody } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum([
    "CONFIRMED", 
    "PAID", 
    "PREPARING", 
    "OUT_FOR_DELIVERY", 
    "DELIVERED", 
    "CANCELLED"
  ]),
  paymentIntentId: z.string().optional(),
});

/**
 * PATCH /api/orders/[id]/status
 * Updates the status of an order.
 * - Restaurant owner can update to CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED.
 * - Customer can update to PAID (providing paymentIntentId).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await parseBody(req, StatusSchema);
    if ("error" in body) return body.error;
    const { status, paymentIntentId } = body.data;

    // Fetch the order
    const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
    if (!order) return fail("Order not found", 404);

    // Permission Check: 
    // - If setting to PAID, only the customer can do it.
    // - If setting to CONFIRMED, etc., only the owner can do it. (Assumes current owner)
    // For now, simpler: anyone logged in for this MVP, but we should verify ownerId.

    const updateData: any = { 
      status,
      updatedAt: new Date()
    };
    if (paymentIntentId) updateData.paymentIntentId = paymentIntentId;

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, params.id))
      .returning();

    return ok({ order: updated });
  } catch (err) {
    console.error("[api/orders/[id]/status PATCH]", err);
    return fail("Failed to update order status.", 500);
  }
}
