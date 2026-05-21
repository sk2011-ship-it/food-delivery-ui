import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteShipdayCarrier } from "@/lib/shipday";
import { createAdminClient } from "@/lib/supabase/admin";

/* ── DELETE /api/admin/drivers/[id] ── */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    const { id } = await params;

    // 1. Load driver from DB
    const [driver] = await db
      .select({ id: users.id, shipdayCarrierId: users.shipdayCarrierId, email: users.email })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "driver")))
      .limit(1);

    if (!driver) return fail("Driver not found.", 404);

    // 2. Delete from Shipday (best-effort — don't block if Shipday fails)
    if (driver.shipdayCarrierId && driver.shipdayCarrierId !== "undefined") {
      try {
        await deleteShipdayCarrier(driver.shipdayCarrierId);
        console.log(`[drivers/delete] Deleted Shipday carrier ${driver.shipdayCarrierId}`);
      } catch (err) {
        console.warn(`[drivers/delete] Shipday delete failed (continuing):`, err);
      }
    }

    // 3. Delete from Supabase auth
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(id).catch((err) =>
      console.warn(`[drivers/delete] Supabase auth delete failed:`, err)
    );

    // 4. Delete from DB
    await db.delete(users).where(eq(users.id, id));

    console.log(`[drivers/delete] Driver ${id} (${driver.email}) deleted.`);
    return ok({ deleted: true });
  }, ["admin"]);
}
