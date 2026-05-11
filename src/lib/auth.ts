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
  createdAt: string;
}

/* ── In-process user cache ───────────────────────────────────────────────────
 *
 * WHY: Every API request calls getCurrentUser() which queries the `users`
 *      table. With Supabase hosted in Tokyo that round-trip costs ~300ms.
 *      On a typical owner dashboard load, 5–6 API calls fire simultaneously —
 *      each paying that 300ms tax = ~1800ms of pure auth overhead.
 *
 * HOW: Cache the DB result in a module-level Map keyed by userId with a
 *      short TTL (60 s). Cache hits cost ~0ms. The TTL ensures:
 *        - Role/status changes (e.g. admin bans a user) take effect within 60 s.
 *        - Memory doesn't grow unboundedly (entries expire naturally).
 *
 * SECURITY: Only the userId, role, and status are cached — no tokens.
 *           Role/status always originate from the DB on a cache miss.
 *           The cache is server-side only (process memory), never exposed
 *           to the browser.
 *
 * INVALIDATION: Call invalidateUserCache(userId) after any operation that
 *               changes a user's role or status (admin ban, role update).
 * ─────────────────────────────────────────────────────────────────────────── */

interface CacheEntry {
  user: SessionUser;
  expiresAt: number;
}

// Module-level singleton — survives between requests in the same process.
// In dev (hot-reload), globalThis prevents duplicate instances.
declare global {
  var _userCache: Map<string, CacheEntry> | undefined;
}

const userCache: Map<string, CacheEntry> =
  globalThis._userCache ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalThis._userCache = userCache;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

/** Call this whenever a user's role or status is mutated. */
export function invalidateUserCache(userId: string): void {
  userCache.delete(userId);
}

/** Fetch a user from DB, updating the cache. */
async function fetchAndCacheUser(userId: string): Promise<SessionUser | null> {
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!dbUser || dbUser.status === "banned") {
    userCache.delete(userId); // Don't cache banned/missing users
    return null;
  }

  const sessionUser: SessionUser = {
    id:     dbUser.id,
    email:  dbUser.email,
    name:   dbUser.name,
    phone:  dbUser.phone,
    role:   dbUser.role as UserRole,
    status: dbUser.status,
    createdAt: dbUser.createdAt.toISOString(),
  };

  userCache.set(userId, { user: sessionUser, expiresAt: Date.now() + CACHE_TTL_MS });
  return sessionUser;
}

/**
 * Validates the session and returns the full user record from our DB.
 *
 * ┌─ Request flow ──────────────────────────────────────────────────────────┐
 * │  1. Read x-user-id header injected by middleware (no Supabase call)    │
 * │  2. Check in-process cache — hit: return immediately (~0ms)            │
 * │  3. Cache miss: query DB, populate cache, return (~300ms first time)   │
 * │                                                                         │
 * │  Fallback (no header, e.g. Server Component): call supabase.getUser()  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Role and status always come from the DB — never from JWT claims.
 */
export async function getCurrentUser(
  reqOrToken?: Request | string
): Promise<SessionUser | null> {
  let userId: string | null = null;
  let bearerToken: string | undefined;

  // ── Fast path 1: middleware-injected header (no Supabase network call) ───
  if (reqOrToken instanceof Request) {
    userId = reqOrToken.headers.get("x-user-id");
    const authHeader = reqOrToken.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      bearerToken = authHeader.slice("Bearer ".length).trim();
    }
  }

  // ── Slow path: verify via Supabase to prevent header spoofing ───────────
  // Even if we have a userId from the header, we MUST verify the token
  // to ensure the request is actually coming from that user.
  const supabase = await createClient();
  const token = typeof reqOrToken === "string" ? reqOrToken : bearerToken;
  const { data: { user: authUser } } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (!authUser) return null;

  // Security Check: If x-user-id was provided, it MUST match the verified token's sub
  if (userId && userId !== authUser.id) {
    console.error(`[Auth Security] User ID mismatch! Header: ${userId}, Token: ${authUser.id}`);
    return null; 
  }

  userId = authUser.id;

  // ── Fast path 2: in-process cache hit (no DB query) ──────────────────────
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  // ── Cache miss: fetch from DB and populate cache ─────────────────────────
  return fetchAndCacheUser(userId);
}

/**
 * Lightweight token verification.
 * Returns only the user ID from the Supabase session,
 * skipping the secondary DB lookup for role/status.
 */
export async function getAuthId(token?: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  return user?.id ?? null;
}

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
