import { ok, fail, withAdminAuth } from "@/lib/proxy";
import { NotificationService } from "@/services/notification.service";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/notifications/test
 * Sends a real WhatsApp + FCM test notification to the logged-in user.
 * Admin only.
 */
export async function POST(req: Request) {
  return withAdminAuth(req, async (user) => {
    try {
      await NotificationService.dispatchOrderNotifications({
        userId: user.id,
        type: "ORDER",
        subject: "Test Notification 🎉",
        body: "This is a real test from Kilkeel Eats. WhatsApp notifications are working correctly!",
        metadata: { orderStatus: "PENDING_CONFIRMATION", targetRole: "owner" },
        channels: ["FCM", "WHATSAPP"],
      });

      return ok({ message: "Test notification dispatched to your FCM and WhatsApp." });
    } catch (err) {
      console.error("[notifications/test]", err);
      return fail("Failed to send test notification", 500);
    }
  });
}
