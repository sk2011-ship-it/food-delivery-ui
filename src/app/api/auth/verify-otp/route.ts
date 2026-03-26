import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token_hash, type, code } = await request.json();
    const supabase = await createClient();

    let error;
    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
    } else if (token_hash) {
      const result = await supabase.auth.verifyOtp({
        token_hash,
        type: type || 'recovery',
      });
      error = result.error;
    } else {
      return NextResponse.json({ error: "Missing token or code" }, { status: 400 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({ 
      success: true, 
      message: "Verification successful",
      user 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
