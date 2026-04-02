import { createClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/proxy";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) return fail("Logout failed.", 500);

  return ok(null);
}
