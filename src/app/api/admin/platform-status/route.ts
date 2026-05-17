import { ok, fail, withAdminAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const [row] = await db
        .select({ isOpen: platformSettings.isOpen })
        .from(platformSettings)
        .where(eq(platformSettings.id, 1))
        .limit(1);
      return ok({ open: row?.isOpen ?? true });
    } catch (err) {
      console.error("[platform-status GET]", err);
      return fail("Failed to fetch platform status.", 500);
    }
  });
}

export async function POST(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      if (typeof body.open !== "boolean") return fail("Invalid value.", 400);

      await db
        .insert(platformSettings)
        .values({ id: 1, isOpen: body.open })
        .onConflictDoUpdate({
          target: platformSettings.id,
          set: { isOpen: body.open, updatedAt: new Date() },
        });

      return ok({ open: body.open });
    } catch (err) {
      console.error("[platform-status POST]", err);
      return fail("Failed to update platform status.", 500);
    }
  });
}
