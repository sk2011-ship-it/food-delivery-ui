import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { restaurants, sunmiPrinters } from "@/lib/db/schema";
import { fail, ok, parseBody, withOwnerAuth } from "@/lib/proxy";
import { sunmiClient } from "@/lib/sunmi";

const BindSchema = z.object({
  restaurantId: z.string().uuid(),
  shopId: z.string().min(1),
  printerMsn: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, BindSchema);
  if ("error" in parsed) return parsed.error;

  return withOwnerAuth(req, async (user) => {
    const { restaurantId, shopId, printerMsn } = parsed.data;
    const [restaurant] = await db
      .select({ id: restaurants.id, name: restaurants.name, ownerId: restaurants.ownerId })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) return fail("Restaurant not found.", 404);
    if (user.role !== "admin" && restaurant.ownerId !== user.id) {
      return fail("You can only manage printers for your own restaurant.", 403);
    }

    await sunmiClient.bindPrinter({ restaurantId, shopId, printerMsn });

    const [saved] = await db
      .insert(sunmiPrinters)
      .values({
        restaurantId,
        shopId,
        printerMsn,
        status: "ACTIVE",
      })
      .onConflictDoUpdate({
        target: sunmiPrinters.restaurantId,
        set: {
          shopId,
          printerMsn,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      })
      .returning();

    return ok({
      restaurantId: saved.restaurantId,
      shopId: saved.shopId,
      printerMsn: saved.printerMsn,
      status: saved.status,
    });
  });
}
