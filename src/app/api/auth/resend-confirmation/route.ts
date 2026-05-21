import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, Schema);
  if ("error" in parsed) return parsed.error;
  const { email } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    console.error("[resend-confirmation] error:", error.message);
    // Don't expose internals — just return a generic success so email enumeration isn't possible
  }

  return ok({ message: "If your email is registered and unverified, a confirmation link has been sent." });
}
