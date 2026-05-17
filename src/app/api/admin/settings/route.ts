import { z } from "zod";
import { ok, fail, parseBody, withAdminAuth } from "@/lib/proxy";
import { SITES, DEFAULT_SITE } from "@/config/sites";

/**
 * In-memory settings store.
 * Seeded from the site config at startup.
 * A proper DB-backed settings table can replace this later.
 */

interface AdminSettings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  deliveryRadius: string;
  notifications: {
    emailNewOrder: boolean;
    emailNewUser: boolean;
    emailNewDriver: boolean;
    smsNewOrder: boolean;
  };
}

declare global {
  var _adminSettings: AdminSettings | undefined;
}

function getDefaultSettings(): AdminSettings {
  const defaultSite = SITES[DEFAULT_SITE];
  return {
    siteName:       defaultSite.name,
    supportEmail:   defaultSite.contact.email,
    supportPhone:   defaultSite.contact.managerPhone || "",
    currency:       "GBP",
    timezone:       "Europe/London",
    deliveryRadius: "10",
    notifications: {
      emailNewOrder:  true,
      emailNewUser:   true,
      emailNewDriver: false,
      smsNewOrder:    false,
    },
  };
}

// Persist across hot-reloads in dev
if (!globalThis._adminSettings) {
  globalThis._adminSettings = getDefaultSettings();
}

function getSettings(): AdminSettings {
  return globalThis._adminSettings!;
}

function saveSettings(patch: AdminSettings): void {
  globalThis._adminSettings = patch;
}

/* ── Zod validation schema ── */
const SettingsSchema = z.object({
  siteName:       z.string().min(1).max(150),
  supportEmail:   z.string().email(),
  supportPhone:   z.string().max(30),
  currency:       z.enum(["GBP", "EUR", "USD"]),
  timezone:       z.enum(["Europe/London", "Europe/Dublin", "UTC"]),
  deliveryRadius: z.string().regex(/^\d+$/, "Must be a number"),
  notifications: z.object({
    emailNewOrder:  z.boolean(),
    emailNewUser:   z.boolean(),
    emailNewDriver: z.boolean(),
    smsNewOrder:    z.boolean(),
  }),
});

/* ── GET /api/admin/settings ── */
export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      return ok(getSettings());
    } catch (err) {
      console.error("[api/admin/settings GET]", err);
      return fail("Failed to load settings.", 500);
    }
  });
}

/* ── POST /api/admin/settings ── */
export async function POST(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const parsed = await parseBody(req, SettingsSchema);
      if ("error" in parsed) return parsed.error;

      saveSettings(parsed.data);
      return ok({ message: "Settings saved successfully." });
    } catch (err) {
      console.error("[api/admin/settings POST]", err);
      return fail("Failed to save settings.", 500);
    }
  });
}
