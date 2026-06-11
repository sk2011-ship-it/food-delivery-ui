import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = "https://yourlocaleats.app/api/webhooks/twilio-voice";

// POST /api/webhooks/twilio-voice
// Two scenarios hit this endpoint:
//   1. Inbound call arrives  → return TwiML to record the caller (Meta OTP)
//   2. Recording completed   → Twilio posts RecordingUrl here (action callback)
export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const recordingUrl    = params.get("RecordingUrl")    ?? "";
  const recordingSid    = params.get("RecordingSid")    ?? "";
  const recordingStatus = params.get("RecordingStatus") ?? "";
  const callSid         = params.get("CallSid")         ?? "";
  const from            = params.get("From")            ?? "";
  const to              = params.get("To")              ?? "";

  // ── Scenario 2: recording is ready, hang up cleanly ──────────────────────
  if (recordingUrl) {
    console.log("🎙️ OTP RECORDING READY");
    console.log("   CallSid:     ", callSid);
    console.log("   RecordingSid:", recordingSid);
    console.log("   Status:      ", recordingStatus);
    console.log("   ✅ MP3:      ", `${recordingUrl}.mp3`);

    // Return TwiML hangup so Twilio ends the call cleanly (no "application error")
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // ── Scenario 1: inbound call — record immediately, no pause ──────────────
  console.log("📞 Inbound call — recording for OTP");
  console.log("   From:", from, "→ To:", to, "| CallSid:", callSid);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record
    maxLength="60"
    playBeep="false"
    action="${WEBHOOK_URL}"
    method="POST"
  />
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
