import { ok, fail } from "@/lib/proxy";
import { cancelExpiredPendingOrders, cancelUnpaidConfirmedOrders } from "@/lib/order-expiration";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    return fail("Unauthorized", 401);
  }

  try {
    const expiredPending = await cancelExpiredPendingOrders();
    const unpaidConfirmed = await cancelUnpaidConfirmedOrders();
    
    const allCancelled = [...expiredPending, ...unpaidConfirmed];
    
    return ok({ 
      cancelledCount: allCancelled.length, 
      details: {
        expiredPending: expiredPending.length,
        unpaidConfirmed: unpaidConfirmed.length
      },
      orders: allCancelled 
    });
  } catch (err) {
    console.error("[cron/cancel-expired-orders]", err);
    return fail("Internal Server Error", 500);
  }
}
