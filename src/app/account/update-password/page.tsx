"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

/**
 * Inner component that uses searchParams.
 * Needs to be wrapped in Suspense for Next.js build to succeed.
 */
function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const code = searchParams.get("code");

      if (tokenHash || code) {
        await authService.verifyOtp({
          token_hash: tokenHash || undefined,
          code: code || undefined,
          type: type || 'recovery'
        });
      }

      await authService.updatePassword(password);

      toast.success("Password updated successfully!");
      await authService.signOut();

      setTimeout(() => {
        router.push("/account/login");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password. Your link may have expired.";
      toast.error(message);
      if (message.toLowerCase().includes("session") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("expired")) {
        setTimeout(() => router.push("/account/forgot-password"), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-orange-600" />
            Set New Password
          </CardTitle>
          <CardDescription>
            Enter your new secure password below to regain access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-40 mx-auto flex justify-center bg-orange-600 hover:bg-orange-700 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  );
}
