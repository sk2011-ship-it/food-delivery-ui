import { ok, fail, withAdminAuth } from "@/lib/proxy";

// GET /api/signal/status
// Returns a list of registered Signal accounts from the signal-cli service.
export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    const apiUrl = process.env.SIGNAL_CLI_API_URL;
    if (!apiUrl) {
      return ok({ configured: false, accounts: [] });
    }

    let res: Response;
    try {
      res = await fetch(`${apiUrl}/v1/accounts`, { method: "GET" });
    } catch (err) {
      console.error("[Signal] status fetch error:", err);
      return ok({ configured: true, reachable: false, accounts: [] });
    }

    if (!res.ok) {
      return ok({ configured: true, reachable: true, accounts: [] });
    }

    const data = await res.json().catch(() => []);
    return ok({ configured: true, reachable: true, accounts: Array.isArray(data) ? data : [] });
  });
}
