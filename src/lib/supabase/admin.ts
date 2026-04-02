import { createClient } from "@supabase/supabase-js";

/**
 * Admin client — uses the secret key (service role).
 * Only use this in server-side API routes, never in client components.
 * Has full database access and bypasses RLS.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
