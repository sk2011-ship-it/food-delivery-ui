import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";
import { checkIpRateLimit } from "@/lib/rate-limit";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, ForgotPasswordSchema);
  if ("error" in parsed) return parsed.error;
  const { email } = parsed.data;

  const blocked = await checkIpRateLimit("FORGOT_PASSWORD", req, { email });
  if (!blocked.allowed) {
    return ok({ sent: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(req.url).origin}/reset-password`,
  });

  if (error) {
    console.error("[forgot-password] reset error:", error.message);
    return fail("Failed to send reset link. Please try again.", 500);
  }

  return ok({ sent: true });
}

