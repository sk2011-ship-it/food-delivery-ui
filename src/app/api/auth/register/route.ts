import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(150),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(7, "Enter a valid phone number.").max(30),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function POST(req: Request) {
  // 1. Validate input
  const parsed = await parseBody(req, RegisterSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, phone, password } = parsed.data;

  const supabase = await createClient();

  // 2. Create the auth user in Supabase
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
    },
  });

  if (signUpError) {
    // Supabase returns "User already registered" for duplicate emails
    if (signUpError.message.toLowerCase().includes("already")) {
      return fail("An account with this email already exists.", 409);
    }
    return fail(signUpError.message, 400);
  }

  if (!authData.user) {
    return fail("Registration failed. Please try again.", 500);
  }

  // 3. Sync user record into our users table
  await db.insert(users).values({
    id: authData.user.id, // use the Supabase auth UUID so both tables stay in sync
    name,
    email,
    phone,
    role: "customer",
    status: "active",
  });

  return ok({
    id: authData.user.id,
    name,
    email,
    phone,
    role: "customer" as const,
  });
}
