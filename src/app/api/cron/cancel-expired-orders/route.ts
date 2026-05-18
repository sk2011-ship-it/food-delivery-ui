import { ok, fail } from "@/lib/proxy";
import { cancelExpiredPendingOrders, cancelExpiredConfirmedOrders } from "@/lib/order-expiration";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    return fail("Unauthorized", 401);
  }

  try {
    // Run both expiry checks in parallel
    const [pendingCancelled, confirmedCancelled] = await Promise.all([
      cancelExpiredPendingOrders(),    // 10-min window: owner must accept
      cancelExpiredConfirmedOrders(),  // 5-min window: customer must pay
    ]);

    return ok({
      pendingCancelled: pendingCancelled.length,
      confirmedCancelled: confirmedCancelled.length,
      orders: [...pendingCancelled, ...confirmedCancelled],
    });
  } catch (err) {
    console.error("[cron/cancel-expired-orders]", err);
    return fail("Internal Server Error", 500);
  }
}
