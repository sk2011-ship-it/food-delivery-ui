import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listShipdayCarriers } from "@/lib/shipday";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTempPassword() {
  return Math.random().toString(36).slice(-6).toUpperCase() +
         Math.random().toString(36).slice(-6) +
         Math.floor(Math.random() * 100);
}

/**
 * POST /api/admin/drivers/sync
 * Pulls all carriers from Shipday and:
 *  1. Updates shipdayCarrierId for existing DB drivers matched by email
 *  2. For Shipday-only carriers: links existing Supabase users (no password change) or creates brand-new ones
 */
export async function POST(req: Request) {
  return withAuth(req, async () => {
    // 1. Fetch all carriers from Shipday
    let carriers;
    try {
      carriers = await listShipdayCarriers();
    } catch (err) {
      console.error("[drivers/sync] Failed to fetch Shipday carriers:", err);
      return fail("Failed to connect to Shipday. Check your API key.", 502);
    }

    if (carriers.length === 0) {
      return ok({ synced: 0, imported: 0, total: 0, message: "No carriers found in Shipday." });
    }

    // 2. Load all our drivers from DB
    const dbDrivers = await db
      .select({ id: users.id, email: users.email, shipdayCarrierId: users.shipdayCarrierId })
      .from(users)
      .where(eq(users.role, "driver"));

    const dbDriversByEmail = new Map(dbDrivers.map((d) => [d.email!.toLowerCase(), d]));

    const adminClient = createAdminClient();
    let synced   = 0;
    let imported = 0;
    // Only brand-new users (not pre-existing Supabase accounts) get a temp password shown
    const importedDrivers: Array<{ name: string; email: string; tempPassword: string; carrierId: number }> = [];

    for (const carrier of carriers) {
      if (!carrier.carrierId) {
        console.warn(`[drivers/sync] Skipping carrier with no carrierId:`, carrier);
        continue;
      }
      if (!carrier.email) {
        console.warn(`[drivers/sync] Skipping carrier ${carrier.carrierId} — no email`);
        continue;
      }

      const emailKey = carrier.email.toLowerCase();
      const dbDriver = dbDriversByEmail.get(emailKey);

      if (dbDriver) {
        // Already in our DB — only sync the carrierId if it changed
        if (!dbDriver.shipdayCarrierId || dbDriver.shipdayCarrierId === "undefined" || dbDriver.shipdayCarrierId !== String(carrier.carrierId)) {
          await db
            .update(users)
            .set({ shipdayCarrierId: String(carrier.carrierId), updatedAt: new Date() })
            .where(eq(users.id, dbDriver.id));
          synced++;
        }
        continue;
      }

      // Not in our DB yet — try to create or link
      try {
        let userId: string;
        let isNewAccount = false;
        const tempPassword = generateTempPassword();

        const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
          email:         carrier.email,
          password:      tempPassword,
          email_confirm: true,
          user_metadata: { name: carrier.name, phone: carrier.phoneNumber },
        });

        if (createErr) {
          // If the Supabase account already exists, look it up and link it —
          // do NOT reset their password.
          const isAlreadyExists = createErr.message?.toLowerCase().includes("already") ||
                                  createErr.message?.toLowerCase().includes("exists") ||
                                  createErr.status === 422;

          if (!isAlreadyExists) {
            console.warn(`[drivers/sync] Auth creation failed for ${carrier.email}:`, createErr.message);
            continue;
          }

          // Find the existing Supabase user by email
          const { data: listData } = await adminClient.auth.admin.listUsers();
          const existing = listData?.users?.find(
            (u) => u.email?.toLowerCase() === emailKey
          );

          if (!existing) {
            console.warn(`[drivers/sync] Could not find existing Supabase user for ${carrier.email}`);
            continue;
          }

          userId = existing.id;
          isNewAccount = false;
          console.log(`[drivers/sync] Linking existing Supabase user ${userId} to Shipday carrier ${carrier.carrierId}`);
        } else {
          if (!createData.user) continue;
          userId = createData.user.id;
          isNewAccount = true;
        }

        await db.insert(users).values({
          id:               userId,
          name:             carrier.name,
          email:            carrier.email,
          phone:            carrier.phoneNumber || "",
          role:             "driver",
          status:           "active",
          shipdayCarrierId: String(carrier.carrierId),
        });

        imported++;

        if (isNewAccount) {
          importedDrivers.push({
            name:         carrier.name,
            email:        carrier.email,
            tempPassword,
            carrierId:    carrier.carrierId,
          });
        }

        console.log(`[drivers/sync] ${isNewAccount ? "Imported" : "Linked"} carrier ${carrier.carrierId} (${carrier.email})`);
      } catch (err) {
        console.error(`[drivers/sync] Failed to import ${carrier.email}:`, err);
      }
    }

    const parts: string[] = [];
    if (synced > 0)   parts.push(`${synced} driver${synced   !== 1 ? "s" : ""} updated`);
    if (imported > 0) parts.push(`${imported} driver${imported !== 1 ? "s" : ""} imported from Shipday`);
    const message = parts.length > 0 ? parts.join(", ") + "." : "All drivers already up to date.";

    console.log(`[drivers/sync] synced=${synced} imported=${imported} total=${carriers.length}`);

    return ok({ synced, imported, total: carriers.length, importedDrivers, message });
  }, ["admin"]);
}
