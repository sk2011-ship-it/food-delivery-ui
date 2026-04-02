"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "@/context/SiteContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye, EyeOff, Mail, Lock, User,
  ArrowRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import type { E164Number } from "libphonenumber-js";
import "react-phone-number-input/style.css";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface Errors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];

export default function RegisterPage() {
  const { site } = useSite();

  const [form, setForm] = useState<FormState>({
    name: "", email: "", password: "", confirmPassword: "", terms: false,
  });
  const [phone, setPhone] = useState<E164Number | undefined>(undefined);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!phone) e.phone = "Phone number is required.";
    else if (!isValidPhoneNumber(phone)) e.phone = "Enter a valid phone number for the selected country.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match.";
    if (!form.terms) e.terms = "You must accept the terms to continue.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Show first error as toast
      const first = Object.values(errs)[0];
      if (first) toast.error(first);
      return;
    }

    setLoading(true);
    const result = await authApi.register({
      name: form.name,
      email: form.email,
      phone: phone as string,
      password: form.password,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Registration failed.");
      return;
    }

    setSuccess(true);
  };

  const strength = passwordStrength(form.password);

  if (success) {
    return (
      <AuthCard
        title="You're all set!"
        subtitle={`Welcome to ${site.name}. Your account has been created.`}
      >
        <div className="text-center py-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-heading font-bold text-gray-900 text-xl mb-2">Account Created!</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
            Welcome, {form.name.split(" ")[0]}! You can now sign in and start ordering from your favourite restaurants.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      subtitle={`Join ${site.name} and order from the best local restaurants.`}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Full name */}
        <FieldWrapper label="Full name" error={errors.name}>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <Input
              name="name"
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              className={inputCls(!!errors.name)}
              autoComplete="name"
            />
          </div>
        </FieldWrapper>

        {/* Email */}
        <FieldWrapper label="Email address" error={errors.email}>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={inputCls(!!errors.email)}
              autoComplete="email"
            />
          </div>
        </FieldWrapper>

        {/* Phone with country selector */}
        <FieldWrapper label="Phone number" error={errors.phone}>
          <div className={`flex h-11 w-full rounded-xl border text-sm transition-colors overflow-hidden ${
            errors.phone
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-white"
          }`}>
            <PhoneInput
              international
              countryCallingCodeEditable={false}
              defaultCountry="GB"
              value={phone}
              onChange={(val) => {
                setPhone(val);
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
              className="phone-input-wrapper w-full"
              numberInputProps={{
                className: "phone-number-input",
                placeholder: "Enter phone number",
                autoComplete: "tel",
              }}
            />
          </div>
        </FieldWrapper>

        {/* Password */}
        <FieldWrapper label="Password" error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              name="password"
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              className={inputCls(!!errors.password) + " pr-10"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      strength >= n ? strengthColor[strength] : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">{strengthLabel[strength]}</p>
            </div>
          )}
        </FieldWrapper>

        {/* Confirm password */}
        <FieldWrapper label="Confirm password" error={errors.confirmPassword}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={inputCls(!!errors.confirmPassword) + " pr-10"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FieldWrapper>

        {/* Terms */}
        <div className="space-y-1 pt-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="terms"
              checked={form.terms}
              onCheckedChange={(v) => {
                setForm((p) => ({ ...p, terms: Boolean(v) }));
                setErrors((p) => ({ ...p, terms: undefined }));
              }}
              className="mt-0.5 rounded-md"
              style={form.terms ? { background: site.theme.primary, borderColor: site.theme.primary } : {}}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer font-normal leading-relaxed">
              I agree to the{" "}
              <Link href="#" className="font-semibold hover:underline" style={{ color: site.theme.primary }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold hover:underline" style={{ color: site.theme.primary }}>
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-xs text-red-500 flex items-center gap-1 pl-0.5">
              <AlertCircle className="w-3 h-3" /> {errors.terms}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create Account <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: site.theme.primary }}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

/* ── Helpers ── */

function FieldWrapper({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `pl-10 h-11 rounded-xl text-sm focus-visible:ring-0 transition-colors ${
    hasError
      ? "border-red-300 focus-visible:border-red-400 bg-red-50"
      : "border-gray-200 focus-visible:border-gray-400"
  }`;
}
