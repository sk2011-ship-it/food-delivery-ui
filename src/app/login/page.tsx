"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/context/SiteContext";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Loading..." subtitle="Checking authentication status...">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </AuthCard>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { site } = useSite();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const { session, isReady } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "email") setUnverifiedEmail(null);
  };

  useEffect(() => {
    // If the user lands here already logged in, send them to the dashboard.
    // We check !loading to prevent this from firing while a manual login is in progress.
    if (isReady && session && !loading) {
      router.replace(redirectTo);
    }
  }, [isReady, session, redirectTo, router, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email) {
      toast.error("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      toast.error("Password is required.");
      return;
    }

    setUnverifiedEmail(null);
    setLoading(true);
    const result = await authApi.login(form.email, form.password);

    if (!result.success || !result.data) {
      setLoading(false);
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(form.email);
        return;
      }
      toast.error(result.error || "Login failed.");
      return;
    }

    // Sync the profile into the store, then navigate client-side.
    await useAuthStore.getState().sync(result.data);
    router.push(redirectTo);
  };

  const handleResend = async () => {
    if (!unverifiedEmail || resending) return;
    setResending(true);
    const result = await authApi.resendConfirmation(unverifiedEmail);
    setResending(false);
    if (result.success) {
      toast.success("Verification email sent! Please check your inbox.");
    } else {
      toast.error("Failed to resend email. Please try again.");
    }
  };

  return (
    <AuthCard
      title="Welcome back!"
      subtitle={`Sign in to order from ${site.location}'s best restaurants.`}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-0 focus-visible:border-gray-400 text-sm"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium hover:underline"
              style={{ color: site.theme.primary }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus-visible:ring-0 focus-visible:border-gray-400 text-sm"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="remember"
            checked={form.remember}
            onCheckedChange={(v) => setForm((p) => ({ ...p, remember: Boolean(v) }))}
            className="rounded-md"
            style={form.remember ? { background: site.theme.primary, borderColor: site.theme.primary } : {}}
          />
          <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer font-normal">
            Keep me signed in
          </Label>
        </div>

        {/* Unverified email banner */}
        {unverifiedEmail && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold mb-0.5">Email not verified</p>
                <p className="text-amber-700 text-xs">Your email address has not been verified. Please check your inbox for the confirmation link.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="mt-2 text-xs font-bold underline underline-offset-2 text-amber-800 hover:text-amber-900 disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
          }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold hover:underline"
          style={{ color: site.theme.primary }}
        >
          Create one free
        </Link>
      </p>
    </AuthCard>

  );
}
