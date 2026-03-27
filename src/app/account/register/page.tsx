"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/api";
import { toast } from "sonner";
export default function AccountRegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        forename: "",
        surname: "",
        mobile: "",
        postcode: "",
        password: "",
        confirm: "",
        emailOpt: false,
        smsOpt: false,
        prefEmail: false,
        prefText: false,
        role: "customer" as "customer" | "owner" | "admin",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirm) {
            toast.error("Passwords do not match ❌");
            return;
        }

        try {
            await authService.signUp(
                form.email,
                form.password,
                form.confirm,
                form.role,
                form.forename,
                form.surname,
                form.mobile,
                form.postcode
            );

            toast.success("Account created successfully");

            setTimeout(() => {
                router.push("/account/login");
            }, 1500);

        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "An error occurred during signup";

            toast.error(message);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle>Create your account</CardTitle>
                    <CardDescription>Fill in the form to get started</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <Input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Forename</label>
                                <Input
                                    type="text"
                                    name="forename"
                                    value={form.forename}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                                <Input
                                    type="text"
                                    name="surname"
                                    value={form.surname}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Checkbox
                                    id="emailOpt"
                                    name="emailOpt"
                                    checked={form.emailOpt}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const { checked } = e.currentTarget;
                                        setForm((p) => ({ ...p, emailOpt: checked }));
                                    }}
                                />
                                <label htmlFor="emailOpt" className="ml-2 text-sm text-gray-600">
                                    Please sign me up for email notifications and offers
                                </label>
                            </div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="smsOpt"
                                    name="smsOpt"
                                    checked={form.smsOpt}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const { checked } = e.currentTarget;
                                        setForm((p) => ({ ...p, smsOpt: checked }));
                                    }}
                                />
                                <label htmlFor="smsOpt" className="ml-2 text-sm text-gray-600">
                                    Please sign me up for SMS notifications and offers
                                </label>
                            </div>
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-gray-700">I want to register as a:</legend>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="customer"
                                        checked={form.role === "customer"}
                                        onChange={() => setForm(p => ({ ...p, role: "customer" }))}
                                        className="h-4 w-4 text-orange-600 border-gray-300"
                                    />
                                    <span className="text-sm text-gray-600">Customer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="owner"
                                        checked={form.role === "owner"}
                                        onChange={() => setForm(p => ({ ...p, role: "owner" }))}
                                        className="h-4 w-4 text-orange-600 border-gray-300"
                                    />
                                    <span className="text-sm text-gray-600">Restaurant Owner</span>
                                </label>
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <Input
                                    type="text"
                                    name="mobile"
                                    value={form.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                <Input
                                    type="text"
                                    name="postcode"
                                    value={form.postcode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        name="confirm"
                                        value={form.confirm}
                                        onChange={handleChange}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-40 mx-auto flex justify-center bg-orange-600 hover:bg-orange-700 cursor-pointer">
                            Create Account
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        By creating an account you&apos;re agreeing to our{' '}
                        <a href="#" className="underline">
                            Terms &amp; Conditions
                        </a>,{' '}
                        <a href="#" className="underline">
                            Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="#" className="underline">
                            Data Use Policy
                        </a>.
                    </p>

                    <p className="text-sm text-center mt-4">
                        Already have an account?{' '}
                        <Link href="/account/login" className="text-orange-600 hover:underline">
                            Login
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
