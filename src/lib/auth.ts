import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type UserRole = "customer" | "admin" | "driver" | "owner";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "active" | "banned";
}

/**
 * Validates the Supabase session cookie, then fetches the full user
 * record from our DB. Role and status always come from the DB —
 * never from JWT claims or local state.
 *
 * Wrapped in React cache() so multiple layouts/pages calling this
 * within the same request share one result — no duplicate DB hits.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();

  // Step 1: verify JWT is valid — proves who they are
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  // Step 2: fetch role + status from DB — decides what they can do
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!dbUser) return null;
  if (dbUser.status === "banned") return null;

  return {
    id:     dbUser.id,
    email:  dbUser.email,
    name:   dbUser.name,
    phone:  dbUser.phone,
    role:   dbUser.role as UserRole,
    status: dbUser.status,
  };
});

/** Redirects to /login if not authenticated. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to /dashboard if role is not allowed. */
export async function requireRole(allowed: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowed.includes(user.role)) redirect("/dashboard");
  return user;
}

export function dashboardPath(role: UserRole): string {
  return `/dashboard/${role}`;
}
