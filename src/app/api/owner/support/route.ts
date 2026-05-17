import { z } from "zod";
import { ok, fail, parseBody, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SupportSchema = z.object({
  subject: z.string().min(1, "Subject is required.").max(200),
  message: z.string().min(10, "Message must be at least 10 characters.").max(5000),
});

/**
 * POST /api/owner/support
 * Accepts a support request from an owner and stores it as a SYSTEM
 * notification for all admin users.
 */
export async function POST(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      const parsed = await parseBody(req, SupportSchema);
      if ("error" in parsed) return parsed.error;

      const { subject, message } = parsed.data;

      // Find all admin users to receive the support notification
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"));

      if (adminUsers.length === 0) {
        console.warn("[api/owner/support] No admin users found to notify.");
      } else {
        const body = `Support request from ${user.name} (${user.email}):\n\n${message}`;
        const notificationSubject = `[Support] ${subject}`;

        await db.insert(notifications).values(
          adminUsers.map((admin) => ({
            recipientId: admin.id,
            type: "SYSTEM" as const,
            subject: notificationSubject,
            body,
            channel: "FCM" as const,
            status: "PENDING" as const,
            metadata: {
              fromUserId:   user.id,
              fromUserName: user.name,
              fromEmail:    user.email,
              supportSubject: subject,
            },
          }))
        );
      }

      return ok({ message: "Support request submitted. We will be in touch soon." });
    } catch (err) {
      console.error("[api/owner/support POST]", err);
      return fail("Failed to submit support request.", 500);
    }
  });
}
