import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const LoginSchema = z.object({
  email:    z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, LoginSchema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;

  // 1. Verify credentials — sets session cookie
  const supabase = await createClient();
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !authData.user) {
    console.error("[login] signIn error:", signInError?.message);
    return fail("Invalid email or password.", 401);
  }

  // 2. Fetch role + status from DB — single source of truth
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authData.user.id))
    .limit(1);

  if (!dbUser) {
    await supabase.auth.signOut();
    return fail("Account not found. Please contact support.", 404);
  }

  if (dbUser.status === "banned") {
    await supabase.auth.signOut();
    return fail("Your account has been suspended. Please contact support.", 403);
  }

  return ok({
    id:    dbUser.id,
    email: dbUser.email,
    role:  dbUser.role,
    name:  dbUser.name,
    phone: dbUser.phone,
  });
}
