import { ok } from "@/lib/proxy";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Public — no auth required, called once by checkout on mount
export async function GET() {
  try {
    const [row] = await db
      .select({ isOpen: platformSettings.isOpen })
      .from(platformSettings)
      .where(eq(platformSettings.id, 1))
      .limit(1);
    return ok({ open: row?.isOpen ?? true });
  } catch {
    return ok({ open: true }); // fail open — never wrongly block customers
  }
}
