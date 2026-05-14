import { ok, fail } from "@/lib/proxy";
import { cancelExpiredPendingOrders } from "@/lib/order-expiration";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    return fail("Unauthorized", 401);
  }

  try {
    const cancelled = await cancelExpiredPendingOrders();
    return ok({ cancelled: cancelled.length, orders: cancelled });
  } catch (err) {
    console.error("[cron/cancel-expired-orders]", err);
    return fail("Internal Server Error", 500);
  }
}
