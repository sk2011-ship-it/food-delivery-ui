"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/context/SiteContext";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function LoginPage() {
  const { site } = useSite();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email) {
      toast.error("Email is required.");
      return;
    }
    if (!form.password) {
      toast.error("Password is required.");
      return;
    }

    setLoading(true);
    const result = await authApi.login(form.email, form.password);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Login failed.");
      return;
    }

    router.push("/dashboard");
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
