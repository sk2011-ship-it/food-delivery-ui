import { ok, fail } from "@/lib/proxy";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/auth/me — returns 200 if logged in, 401 if guest */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Unauthorized", 401);
  return ok({ id: user.id, name: user.name, role: user.role });
}
