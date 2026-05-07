import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";

const RegisterSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters.").max(150),
  email:    z.string().email("Enter a valid email address."),
  phone:    z.preprocess(
    (value) => normalizePhone(value),
    z.string().regex(/^\+?\d{10,15}$/, "Phone number must be between 10 and 15 digits, with an optional leading +."),
  ),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, RegisterSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, phone, password } = parsed.data;

  const blocked = await checkIpRateLimit("REGISTER", req, { email });
  if (!blocked.allowed) {
    return fail("Unable to create account right now. Please try again.", 429);
  }

  // 1. Create auth user (normal signup with publishable key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY!
  );

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });

  if (signUpError) {
    const message = signUpError.message.toLowerCase();
    console.error("[register] signUp error:", signUpError.status, signUpError.message);

    if (message.includes("already")) {
      return fail("An account with this email already exists.", 409);
    }
    if (message.includes("rate limit")) {
      return fail("Too many signup attempts. Please wait a few minutes before trying again.", 429);
    }

    return fail("Unable to create account right now. Please try again.", 400);
  }

  // Duplicate email with email-confirm OFF returns user but empty identities
  if (!authData.user || authData.user.identities?.length === 0) {
    return fail("An account with this email already exists.", 409);
  }

  const userId = authData.user.id;

  // 2. Write user to our DB — role defaults to "customer", status to "active"
  try {
    await db.insert(users).values({
      id: userId,
      name,
      email,
      phone,
      role:   "customer",
      status: "active",
    });
  } catch (dbError) {
    console.error("[register] DB insert failed:", dbError);

    const pgErr = dbError as { code?: string; constraint_name?: string; constraint?: string };
    const constraint = (pgErr.constraint_name ?? pgErr.constraint ?? "").toLowerCase();

    if (
      pgErr.code === "23505" &&
      (constraint.includes("users_pkey") || constraint.includes("users_email_key"))
    ) {
      return fail("An account with this email already exists. Please sign in instead.", 409);
    }

    // Roll back the auth user so there's no orphan
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(userId).catch(() => null);
    return fail("Registration failed. Please try again.", 500);
  }

  await checkIpRateLimit("REGISTER", req, { email });

  return ok({
    id: userId,
    name,
    email,
    phone,
    role: "customer",
    needsEmailVerification: !authData.session,
  });
}
