import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const MAX_TOKENS = 5; // keep at most 5 active devices per user
const MAX_STORED_LENGTH = 255;

function parseTokens(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === "string");
  } catch {}
  // Backward-compat: old single-token plain string
  return [raw];
}

export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const { token } = await req.json();
      if (!token || typeof token !== "string") {
        return fail("FCM token required", 400);
      }

      const [row] = await db
        .select({ fcmToken: users.fcmToken })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const existing = parseTokens(row?.fcmToken ?? null);
      // Deduplicate then cap to MAX_TOKENS (keep most recent)
      const updated = [...new Set([...existing.filter(t => t !== token), token])].slice(-MAX_TOKENS);
      const serialized = JSON.stringify(updated);
      const valueToStore = serialized.length <= MAX_STORED_LENGTH ? serialized : token;

      await db
        .update(users)
        .set({ fcmToken: valueToStore, lastActive: new Date() })
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
      const { searchParams } = new URL(req.url);
      const tokenToRemove = searchParams.get("token");

      if (tokenToRemove) {
        // Remove only this device's token
        const [row] = await db
          .select({ fcmToken: users.fcmToken })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        const remaining = parseTokens(row?.fcmToken ?? null).filter(t => t !== tokenToRemove);
        await db
          .update(users)
          .set({
            fcmToken: remaining.length
              ? (JSON.stringify(remaining).length <= MAX_STORED_LENGTH ? JSON.stringify(remaining) : remaining[remaining.length - 1])
              : null,
          })
          .where(eq(users.id, user.id));
      } else {
        // No specific token — clear all (full logout / account deletion)
        await db
          .update(users)
          .set({ fcmToken: null })
          .where(eq(users.id, user.id));
      }

      return ok({ success: true });
    } catch (err) {
      console.error("FCM Token Clear error:", err);
      return fail("Internal Server Error", 500);
    }
  });
}
