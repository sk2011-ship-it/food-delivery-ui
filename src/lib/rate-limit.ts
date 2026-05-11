export type RateLimitAction = "LOGIN_FAILED" | "REGISTER" | "FORGOT_PASSWORD";

export interface RateLimitResult {
  allowed: boolean;
}

function getSupabaseFunctionUrl(functionName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  return `${baseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`;
}

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

export async function checkIpRateLimit(
  action: RateLimitAction,
  req: Request,
  meta?: Record<string, string | undefined>
): Promise<RateLimitResult> {
  const url = getSupabaseFunctionUrl("rate-limitor");
  const ip = getRequestIp(req);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY ?? ""}`,
      },
      body: JSON.stringify({
        action,
        ip,
        meta: meta ?? {},
      }),
    });

  if (response.status === 429) {
    return { allowed: false };
  }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Rate limit check failed (${response.status}):`, errorText);
      return { allowed: true };
    }

    return (await response.json()) as RateLimitResult;
  } catch (error) {
    console.error("Rate limit check failed (network/server error):", error);
    return { allowed: true };
  }
}
