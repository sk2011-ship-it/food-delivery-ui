import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const from = params.get("From") ?? "";
  const to = params.get("To") ?? "";
  const message = params.get("Body") ?? "";

  console.log("📱 Inbound SMS received:");
  console.log("   From:", from);
  console.log("   To:", to);
  console.log("   Body:", message);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
