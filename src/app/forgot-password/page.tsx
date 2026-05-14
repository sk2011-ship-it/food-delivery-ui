"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useSite } from "@/context/SiteContext";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { site } = useSite();
  const router = useRouter();
  const { isReady, session } = useAuthStore();

  useEffect(() => {
    if (isReady && session) {
      router.replace("/dashboard");
    }
  }, [isReady, session, router]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset link. Please try again.");
      }

      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      setError(message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="We've sent you a password reset link."
      >
        <div className="text-center py-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <h3 className="font-heading font-bold text-gray-900 text-xl mb-2">
            Email sent!
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-xs mx-auto">
            We sent a reset link to{" "}
            <span className="font-semibold text-gray-800">{email}</span>.
            Check your inbox and follow the instructions.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="font-semibold hover:underline"
              style={{ color: site.theme.primary }}
            >
              try again
            </button>
            .
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
            }}
          >
            Back to Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthCard>
    );
  }

  /* ── Form state ── */
  return (
    <AuthCard
      title="Forgot password?"
      subtitle="No worries — we'll send you a reset link."
    >
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-0 focus-visible:border-gray-400 text-sm"
              autoComplete="email"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-400 pt-0.5">
            Enter the email you registered with and we&apos;ll send a reset link.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
          }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </AuthCard>
  );
}
