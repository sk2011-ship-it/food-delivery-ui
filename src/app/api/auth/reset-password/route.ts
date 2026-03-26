import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, redirectTo } = await request.json();
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Reset link sent to your email" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
