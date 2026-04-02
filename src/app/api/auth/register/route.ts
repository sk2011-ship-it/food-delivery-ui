import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const RegisterSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters.").max(150),
  email:    z.string().email("Enter a valid email address."),
  phone:    z.string().min(7, "Enter a valid phone number.").max(30),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, RegisterSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, phone, password } = parsed.data;

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
    console.error("[register] signUp error:", signUpError.status, signUpError.message);
    if (signUpError.message.toLowerCase().includes("already")) {
      return fail("An account with this email already exists.", 409);
    }
    return fail(signUpError.message, 400);
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
    // Roll back the auth user so there's no orphan
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(userId).catch(() => null);
    return fail("Registration failed. Please try again.", 500);
  }

  return ok({ id: userId, name, email, phone, role: "customer" });
}
