/**
 * api-guard.ts — protects API routes.
 *
 * Validates:
 *   1. Supabase JWT from cookie is valid (logged in)
 *   2. User exists in our users table
 *   3. User is not banned
 *   4. User has the required role (role always read from DB)
 */
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fail } from "@/lib/proxy";
import type { UserRole } from "@/lib/auth";
import type { NextResponse } from "next/server";

export interface GuardedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
}

type GuardResult =
  | { ok: true;  user: GuardedUser; error: null }
  | { ok: false; user: null;        error: NextResponse };

/**
 * @example
 * export async function POST(req: Request) {
 *   const guard = await guardApi(["admin", "owner"]);
 *   if (!guard.ok) return guard.error;
 *   // guard.user is trusted — role from DB
 * }
 */
export async function guardApi(allowedRoles?: UserRole[]): Promise<GuardResult> {
  const supabase = await createClient();

  // 1. Verify JWT — confirms identity
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  if (error || !authUser) {
    return { ok: false, user: null, error: fail("Unauthorized.", 401) };
  }

  // 2. Fetch user from DB — role and status always from DB
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!dbUser) {
    return { ok: false, user: null, error: fail("Account not found.", 404) };
  }

  if (dbUser.status === "banned") {
    return { ok: false, user: null, error: fail("Your account has been suspended.", 403) };
  }

  const role = dbUser.role as UserRole;

  // 3. Role check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { ok: false, user: null, error: fail("Forbidden.", 403) };
  }

  return {
    ok: true,
    error: null,
    user: { id: dbUser.id, email: dbUser.email, role, name: dbUser.name, phone: dbUser.phone },
  };
}
