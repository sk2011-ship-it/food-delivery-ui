import { fail, withAdminAuth } from "@/lib/proxy";

// GET /api/signal/qr?deviceName=FoodDelivery
// Proxies the QR code image from signal-cli for device linking.
// Scan the returned QR with your existing Signal app → Settings → Linked Devices → Link New Device.
export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    const apiUrl = process.env.SIGNAL_CLI_API_URL;
    if (!apiUrl) {
      return fail("SIGNAL_CLI_API_URL is not configured.", 500);
    }

    const { searchParams } = new URL(req.url);
    const deviceName = searchParams.get("deviceName") || "FoodDelivery";

    let res: Response;
    try {
      res = await fetch(
        `${apiUrl}/v1/qrcodelink?device_name=${encodeURIComponent(deviceName)}`,
        { method: "GET" }
      );
    } catch (err) {
      console.error("[Signal] QR fetch error:", err);
      return fail(
        "Could not reach the Signal CLI service. Make sure it is running and SIGNAL_CLI_API_URL is correct.",
        502
      );
    }

    if (!res.ok) {
      return fail(`Signal CLI returned status ${res.status}`, res.status);
    }

    const imageBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new Response(imageBuffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  });
}
