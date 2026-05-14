import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const { token } = await req.json();
      if (!token) {
        return fail("FCM token required", 400);
      }

      await db
        .update(users)
        .set({ fcmToken: token, lastActive: new Date() })
        .where(eq(users.id, user.id));

      return ok({ success: true });
    } catch (err) {
      console.error("FCM Token Storage error:", err);
      return fail("Internal Server Error", 500);
    }
  });
}

export async function DELETE(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await db
        .update(users)
        .set({ fcmToken: null })
        .where(eq(users.id, user.id));

      return ok({ success: true, message: "FCM token cleared" });
    } catch (err) {
      console.error("FCM Token Clear error:", err);
      return fail("Internal Server Error", 500);
    }
  });
}
