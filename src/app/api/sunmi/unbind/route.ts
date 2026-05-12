import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { restaurants, sunmiPrinters } from "@/lib/db/schema";
import { fail, ok, parseBody, withOwnerAuth } from "@/lib/proxy";
import { sunmiClient } from "@/lib/sunmi";

const UnbindSchema = z.object({
  restaurantId: z.string().uuid(),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, UnbindSchema);
  if ("error" in parsed) return parsed.error;

  return withOwnerAuth(req, async (user) => {
    const printer = await db.query.sunmiPrinters.findFirst({
      where: eq(sunmiPrinters.restaurantId, parsed.data.restaurantId),
    });

    if (!printer) return fail("No Sunmi printer is bound to this restaurant.", 404);
    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, parsed.data.restaurantId),
    });
    if (restaurant && user.role !== "admin" && restaurant.ownerId !== user.id) {
      return fail("You can only unbind printers for your own restaurant.", 403);
    }

    await sunmiClient.unbindPrinter({
      restaurantId: printer.restaurantId,
      shopId: printer.shopId,
      printerMsn: printer.printerMsn,
    });

    await db.delete(sunmiPrinters).where(eq(sunmiPrinters.restaurantId, parsed.data.restaurantId));

    return ok({ restaurantId: parsed.data.restaurantId, status: "unbound" });
  });
}
