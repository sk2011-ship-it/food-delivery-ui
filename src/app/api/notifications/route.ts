import { ok, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/notifications
 * Fetches the 15 most recent notifications for the currently logged-in user.
 */
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    // Only return FCM channel notifications — WhatsApp rows are duplicates
    // of the same event sent to the phone (not relevant for in-app display).
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, user.id),
          eq(notifications.channel, "FCM")
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(15);

    return ok({ notifications: userNotifications });
  });
}
