"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/context/SiteContext";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const { site } = useSite();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Supabase sends tokens in the URL hash: #access_token=...&refresh_token=...&type=signup
    // We must parse them manually — getSession() won't auto-process the hash with @supabase/ssr.
    const hash = window.location.hash.substring(1); // strip leading "#"
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setStatus("error");
      return;
    }

    const supabase = createClient();

    // setSession exchanges the tokens, which also marks the email as confirmed in Supabase.
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }: { data: { session: import("@supabase/supabase-js").Session | null }, error: import("@supabase/supabase-js").AuthError | null }) => {
        if (error || !data.session) {
          console.error("[auth/callback] setSession error:", error?.message);
          setStatus("error");
          return;
        }
        // Sign out immediately — email is confirmed, user should log in themselves.
        return supabase.auth.signOut();
      })
      .then(() => {
        setStatus("success");
      })
      .catch((err: unknown) => {
        console.error("[auth/callback] unexpected error:", err);
        setStatus("error");
      });
  }, []);

  // Auto-redirect to login after success
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.replace("/login");
      return;
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${site.theme.gradientFrom}22, ${site.theme.accent}18)`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-black text-lg shadow-lg"
            style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
          >
            {site.name}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Status header */}
          <div
            className="px-8 py-6 text-center"
            style={{
              background:
                status === "error"
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
            }}
          >
            <h1 className="text-2xl font-black text-white">
              {status === "loading" && "Verifying your email…"}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </h1>
          </div>

          <div className="px-8 py-10 text-center">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <span
                  className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
                  style={{
                    borderColor: `${site.theme.accent}40`,
                    borderTopColor: site.theme.accent,
                  }}
                />
                <p className="text-gray-500 text-sm">Please wait…</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                  }}
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-gray-700 font-semibold text-base mb-1">
                    Your email address has been confirmed.
                  </p>
                  <p className="text-gray-400 text-sm">
                    You can now sign in to your account and start ordering.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                  }}
                >
                  Sign In Now <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-gray-400">
                  Redirecting to login in {countdown}s…
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="text-gray-700 font-semibold text-base mb-1">
                    This link is invalid or has expired.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Verification links expire after 1 hour. Please register again or request a new confirmation email from the login page.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="mt-2 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                  }}
                >
                  Back to Register <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
