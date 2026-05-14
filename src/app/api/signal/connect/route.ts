import { z } from "zod";
import { parseBody, ok, fail, withAdminAuth } from "@/lib/proxy";

const ConnectSchema = z.object({
  phoneNumber: z.string().min(7, "Enter a valid phone number."),
});

// POST /api/signal/connect
// Registers a phone number with the signal-cli REST API.
// The signal-cli service URL is read from SIGNAL_CLI_API_URL env var.
export async function POST(req: Request) {
  return withAdminAuth(req, async () => {
    const parsed = await parseBody(req, ConnectSchema);
    if ("error" in parsed) return parsed.error;
    const { phoneNumber } = parsed.data;

    const apiUrl = process.env.SIGNAL_CLI_API_URL;
    if (!apiUrl) {
      return fail("SIGNAL_CLI_API_URL is not configured.", 500);
    }

    // Normalize: ensure leading +
    const normalized = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber.replace(/\D/g, "")}`;

    let res: Response;
    try {
      res = await fetch(
        `${apiUrl}/v1/register/${encodeURIComponent(normalized)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use_voice: false }),
        }
      );
    } catch (err) {
      console.error("[Signal] connect fetch error:", err);
      return fail(
        "Could not reach the Signal CLI service. Make sure it is running and SIGNAL_CLI_API_URL is correct.",
        502
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        (body as any).error ||
        (body as any).message ||
        `Signal CLI returned status ${res.status}`;
      return fail(msg, res.status);
    }

    return ok({ message: "Registration started. Check your phone for the SMS verification code." });
  });
}
