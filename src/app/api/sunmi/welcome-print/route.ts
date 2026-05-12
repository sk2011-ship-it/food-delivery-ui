import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { restaurants, sunmiPrinters } from "@/lib/db/schema";
import { fail, ok, parseBody, withOwnerAuth } from "@/lib/proxy";
import { sunmiClient } from "@/lib/sunmi";

const WelcomeSchema = z.object({
  restaurantId: z.string().uuid(),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, WelcomeSchema);
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
      return fail("You can only print for your own restaurant.", 403);
    }

    const orderId = `welcome:${encodeURIComponent(restaurant?.name ?? "Kilkeel Eats")}:${encodeURIComponent(printer.shopId)}:${encodeURIComponent(printer.printerMsn)}`;

    await sunmiClient.pushPrinter({
      restaurantId: printer.restaurantId,
      shopId: printer.shopId,
      printerMsn: printer.printerMsn,
      orderId,
    });

    return ok({
      restaurantId: printer.restaurantId,
      status: "queued",
      jobType: "welcome",
    });
  });
}
