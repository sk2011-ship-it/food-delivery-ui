/**
 * GET /api/orders/[id]/ai-suggestion
 *
 * Returns an alternative restaurant + dish suggestion when the current order
 * (which must still be PENDING_CONFIRMATION) is taking too long to be accepted.
 *
 * Isolated endpoint — all logic lives in src/lib/ai-suggestion.ts.
 * Returns 200 with `{ suggestion: AiSuggestion }` or `{ suggestion: null }`.
 */

import { withAuth, ok, fail } from "@/lib/proxy";
import { getAlternativeSuggestion } from "@/lib/ai-suggestion";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;

      // Verify this order belongs to the requesting customer
      const [order] = await db
        .select({ userId: orders.userId, status: orders.status })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) return fail("Order not found.", 404);
      if (order.userId !== user.id && user.role !== "admin") {
        return fail("Forbidden.", 403);
      }
      if (order.status !== "PENDING_CONFIRMATION") {
        // Order is no longer waiting — no suggestion needed
        return ok({ suggestion: null });
      }

      const suggestion = await getAlternativeSuggestion(id);
      return ok({ suggestion });
    } catch (err) {
      console.error("[ai-suggestion GET]", err);
      return fail("Failed to fetch suggestion.", 500);
    }
  });
}
