import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: Request) {
  // 1. Validate input
  const parsed = await parseBody(req, LoginSchema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;

  const supabase = await createClient();

  // 2. Authenticate with Supabase
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Return a generic message — never reveal whether the email exists
    return fail("Invalid email or password.", 401);
  }

  if (!authData.user) {
    return fail("Login failed. Please try again.", 500);
  }

  // 3. Check our DB for account status (banned check) and role
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authData.user.id))
    .limit(1);

  if (!dbUser) {
    // Auth user exists but no DB record — data inconsistency, sign them out
    await supabase.auth.signOut();
    return fail("Account not found. Please contact support.", 404);
  }

  if (dbUser.status === "banned") {
    await supabase.auth.signOut();
    return fail("Your account has been suspended. Please contact support.", 403);
  }

  // 4. Session cookies are set automatically by the server Supabase client
  return ok({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    role: dbUser.role,
  });
}
