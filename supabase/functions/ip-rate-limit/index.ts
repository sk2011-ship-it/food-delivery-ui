import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Action = "LOGIN_FAILED" | "REGISTER" | "FORGOT_PASSWORD";

type Payload = {
  action?: Action;
  ip?: string;
  meta?: {
    email?: string;
    [key: string]: string | undefined;
  };
};

const WINDOW_MS: Record<Action, number> = {
  LOGIN_FAILED: 60 * 60 * 1000,
  REGISTER: 5 * 60 * 1000,
  FORGOT_PASSWORD: 5 * 60 * 1000,
};

const LIMIT: Record<Action, number> = {
  LOGIN_FAILED: 3,
  REGISTER: 5,
  FORGOT_PASSWORD: 3,
};

const BLOCK_MS = 60 * 60 * 1000;

serve(async (req) => {
  try {
    const { action, ip, meta } = (await req.json()) as Payload;
    if (!action || !ip) {
      return new Response(JSON.stringify({ error: "Missing action or ip" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const normalizedEmail = meta?.email?.trim().toLowerCase();
    const rateKey = normalizedEmail ? `${ip}:${normalizedEmail}` : ip;

    const { data: existing } = await supabase
      .from("ip_rate_limits")
      .select("*")
      .eq("ip_address", rateKey)
      .eq("action", action)
      .maybeSingle();

    if (existing?.blocked_until && new Date(existing.blocked_until).getTime() > now.getTime()) {
      return new Response(JSON.stringify({ allowed: false }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existingWindowStart = existing?.window_start ? new Date(existing.window_start) : null;
    const windowReset = !existingWindowStart || now.getTime() - existingWindowStart.getTime() > WINDOW_MS[action];

    const attemptCount = windowReset
      ? 1
      : Number(existing?.attempt_count ?? 0) + 1;

    const shouldBlock = attemptCount > LIMIT[action];
    const blockedUntil = shouldBlock ? new Date(now.getTime() + BLOCK_MS).toISOString() : null;
    const currentWindowStart = existing?.window_start ?? now.toISOString();

    const payload = {
      ip_address: rateKey,
      action,
      attempt_count: attemptCount,
      window_start: windowReset ? now.toISOString() : currentWindowStart,
      blocked_until: blockedUntil,
      updated_at: now.toISOString(),
      created_at: existing?.created_at ?? now.toISOString(),
    };

    // Assumes a unique index on (ip_address, action) so the upsert stays atomic.
    const { error } = await supabase.from("ip_rate_limits").upsert(payload, {
      onConflict: "ip_address,action",
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (blockedUntil) {
      return new Response(JSON.stringify({ allowed: false }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ allowed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ip-rate-limit error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
