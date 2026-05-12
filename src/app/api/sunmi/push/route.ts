import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, restaurants, sunmiPrinters } from "@/lib/db/schema";
import { fail, ok, parseBody, withOwnerAuth } from "@/lib/proxy";
import { sunmiClient } from "@/lib/sunmi";

const PushSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, PushSchema);
  if ("error" in parsed) return parsed.error;

  return withOwnerAuth(req, async (user) => {
    const [order] = await db
      .select({
        id: orders.id,
        restaurantId: orders.restaurantId,
        ownerId: restaurants.ownerId,
      })
      .from(orders)
      .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .where(eq(orders.id, parsed.data.orderId))
      .limit(1);

    if (!order) return fail("Order not found.", 404);
    if (user.role !== "admin" && order.ownerId !== user.id) {
      return fail("You can only print orders for your own restaurant.", 403);
    }

    const printer = await db.query.sunmiPrinters.findFirst({
      where: eq(sunmiPrinters.restaurantId, order.restaurantId),
    });

    if (!printer) return fail("No Sunmi printer is bound to this restaurant.", 404);

    await sunmiClient.pushPrinter({
      restaurantId: printer.restaurantId,
      shopId: printer.shopId,
      printerMsn: printer.printerMsn,
      orderId: order.id,
    });

    return ok({
      orderId: order.id,
      printerMsn: printer.printerMsn,
      status: "queued",
    });
  });
}
