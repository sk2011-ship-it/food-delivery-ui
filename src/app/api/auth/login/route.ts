import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkIpRateLimit, getRequestIp } from "@/lib/rate-limit";
import { ipRateLimits } from "@/lib/db/schema";

const LoginSchema = z.object({
  email:    z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, LoginSchema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const blocked = await checkIpRateLimit("LOGIN_FAILED", req, { email });
  if (!blocked.allowed) {
    return fail("Too many login attempts. Please try again in an hour.", 429);
  }

  // 1. Verify credentials — sets session cookie
  const supabase = await createClient();
  const { data: { session: existingSession } } = await supabase.auth.getSession();

  // If this browser is already signed in as the same account, avoid creating
  // a second Supabase session. That keeps repeated login clicks idempotent.
  if (existingSession?.user?.email?.trim().toLowerCase() === normalizedEmail) {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingSession.user.id))
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
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
      phone: dbUser.phone,
    });
  }

  // If a different session is already present in this browser, revoke it
  // first so we do not leave stale auth cookies behind.
  if (existingSession) {
    await supabase.auth.signOut();
  }

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !authData.user) {
    console.error("[login] signIn error:", signInError?.message);
    return fail("Invalid email or password.", 401);
  }

  const ip = getRequestIp(req);
  const rateKey = `${ip}:${email.trim().toLowerCase()}`;
  await db.delete(ipRateLimits).where(
    and(
      eq(ipRateLimits.ipAddress, rateKey),
      eq(ipRateLimits.action, "LOGIN_FAILED")
    )
  );

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
