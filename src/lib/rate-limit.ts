import { db } from "@/lib/db";
import { ipRateLimits } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type RateLimitAction = "LOGIN_FAILED" | "REGISTER" | "FORGOT_PASSWORD";

export interface RateLimitResult {
  allowed: boolean;
}

const LIMITS: Record<RateLimitAction, { maxAttempts: number; windowMs: number; blockMs: number }> = {
  LOGIN_FAILED:    { maxAttempts: 10, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  REGISTER:        { maxAttempts: 5,  windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  FORGOT_PASSWORD: { maxAttempts: 5,  windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
};

export function getRequestIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Read-only check: is this IP+action currently blocked?
 * Fast — single indexed DB read, no external HTTP call.
 */
export async function checkIpRateLimit(
  action: RateLimitAction,
  req: Request,
  meta?: Record<string, string | undefined>
): Promise<RateLimitResult> {
  const ip = getRequestIp(req);
  const key = meta?.email ? `${ip}:${meta.email.trim().toLowerCase()}` : ip;

  try {
    const [record] = await db
      .select({ blockedUntil: ipRateLimits.blockedUntil, attemptCount: ipRateLimits.attemptCount, windowStart: ipRateLimits.windowStart })
      .from(ipRateLimits)
      .where(and(eq(ipRateLimits.ipAddress, key), eq(ipRateLimits.action, action)))
      .limit(1);

    if (!record) return { allowed: true };

    const now = Date.now();

    // Active block
    if (record.blockedUntil && record.blockedUntil.getTime() > now) {
      return { allowed: false };
    }

    // Window expired — stale record, treat as fresh
    const { windowMs } = LIMITS[action];
    if (record.windowStart && record.windowStart.getTime() + windowMs < now) {
      return { allowed: true };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[rate-limit] check failed:", err);
    // Fail open on read errors to avoid locking users out due to DB hiccups
    return { allowed: true };
  }
}

/**
 * Called after a confirmed failed attempt (wrong password, bad OTP, etc.).
 * Increments the counter and sets a block if the limit is exceeded.
 */
export async function recordFailedAttempt(
  action: RateLimitAction,
  req: Request,
  meta?: Record<string, string | undefined>
): Promise<void> {
  const ip = getRequestIp(req);
  const key = meta?.email ? `${ip}:${meta.email.trim().toLowerCase()}` : ip;
  const { maxAttempts, windowMs, blockMs } = LIMITS[action];
  const now = new Date();

  try {
    const [existing] = await db
      .select()
      .from(ipRateLimits)
      .where(and(eq(ipRateLimits.ipAddress, key), eq(ipRateLimits.action, action)))
      .limit(1);

    if (!existing) {
      await db.insert(ipRateLimits).values({
        ipAddress:    key,
        action,
        attemptCount: 1,
        windowStart:  now,
        blockedUntil: null,
      });
      return;
    }

    // Window expired — reset
    const windowExpired = existing.windowStart.getTime() + windowMs < now.getTime();
    const newCount = windowExpired ? 1 : (existing.attemptCount ?? 0) + 1;
    const blocked  = newCount >= maxAttempts;

    await db
      .update(ipRateLimits)
      .set({
        attemptCount: newCount,
        windowStart:  windowExpired ? now : existing.windowStart,
        blockedUntil: blocked ? new Date(now.getTime() + blockMs) : null,
        updatedAt:    now,
      })
      .where(eq(ipRateLimits.id, existing.id));
  } catch (err) {
    console.error("[rate-limit] recordFailedAttempt failed:", err);
  }
}
