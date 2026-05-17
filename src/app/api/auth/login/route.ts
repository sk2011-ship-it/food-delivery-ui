import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkIpRateLimit, recordFailedAttempt, getRequestIp } from "@/lib/rate-limit";
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

  // Fast DB-based rate limit check (single indexed read, no external HTTP call)
  const rateCheck = await checkIpRateLimit("LOGIN_FAILED", req, { email });
  if (!rateCheck.allowed) {
    return fail("Too many login attempts. Please try again in an hour.", 429);
  }

  const supabase = await createClient();

  // If the browser already has a valid session for this same account,
  // skip re-authentication and just return the DB profile.
  // getSession() reads from the request cookie — no network call to Supabase.
  const { data: { session: existingSession } } = await supabase.auth.getSession();
  if (existingSession?.user?.email?.trim().toLowerCase() === normalizedEmail) {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingSession.user.id))
      .limit(1);

    if (dbUser && dbUser.status !== "banned") {
      return ok({ id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.name, phone: dbUser.phone });
    }

    // Session exists but DB user is missing or banned — sign out and proceed to fresh login
    await supabase.auth.signOut();
  } else if (existingSession) {
    // Different account is logged in — clear it first
    await supabase.auth.signOut();
  }

  // Authenticate with Supabase
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !authData.user) {
    console.error("[login] signIn error:", signInError?.message);
    // Record the failed attempt (non-blocking — don't await, don't slow down response)
    void recordFailedAttempt("LOGIN_FAILED", req, { email });
    return fail("Invalid email or password.", 401);
  }

  // Successful login: clear rate-limit record + fetch DB profile in parallel
  const ip = getRequestIp(req);
  const rateKey = `${ip}:${normalizedEmail}`;
  const [, [dbUser]] = await Promise.all([
    db.delete(ipRateLimits).where(
      and(eq(ipRateLimits.ipAddress, rateKey), eq(ipRateLimits.action, "LOGIN_FAILED"))
    ),
    db.select().from(users).where(eq(users.id, authData.user.id)).limit(1),
  ]);

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
