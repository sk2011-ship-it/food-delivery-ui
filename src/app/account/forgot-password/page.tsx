"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.requestPasswordReset(
        email,
        `${window.location.origin}/account/update-password`
      );

      setSuccess(true);
      toast.success("Reset link sent to your email!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-40 mx-auto flex justify-center bg-orange-600 hover:bg-orange-700 cursor-pointer"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox.
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/account/login"
              className="text-sm text-orange-600 hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
