import { NextRequest, NextResponse } from "next/server";

// POST /api/webhooks/twilio-voice
// Twilio calls this when +44 7480 559819 receives an inbound call.
// We pause briefly, then record the caller's audio — this captures the Meta OTP.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const from            = params.get("From")            ?? "";
  const to              = params.get("To")              ?? "";
  const callSid         = params.get("CallSid")         ?? "";
  const recordingUrl    = params.get("RecordingUrl")    ?? "";
  const recordingSid    = params.get("RecordingSid")    ?? "";
  const recordingStatus = params.get("RecordingStatus") ?? "";

  // Recording callback — Twilio POSTs here after the recording is ready
  if (recordingUrl) {
    console.log("🎙️ RECORDING READY:");
    console.log("   CallSid:         ", callSid);
    console.log("   RecordingSid:    ", recordingSid);
    console.log("   RecordingStatus: ", recordingStatus);
    console.log("   ✅ Listen here:  ", `${recordingUrl}.mp3`);
    return new NextResponse("OK", { status: 200 });
  }

  // Inbound call — answer, wait 2 s, then record caller audio (30 s max)
  console.log("📞 Inbound call received:");
  console.log("   From:    ", from);
  console.log("   To:      ", to);
  console.log("   CallSid: ", callSid);

  const callbackUrl = "https://yourlocaleats.app/api/webhooks/twilio-voice";

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="2"/>
  <Record maxLength="30" playBeep="false" recordingStatusCallback="${callbackUrl}" recordingStatusCallbackMethod="POST"/>
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
