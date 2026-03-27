"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Checkbox from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Lock, User, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { authService } from "@/services/api";
import { toast } from "sonner";
export default function AccountPage() {
  const router = useRouter();
  const { user, role, userDetails, loading: authLoading, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    postcode: "",
    emailOpt: false,
    smsOpt: false,
    prefEmail: false,
    prefText: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/account/login");
      return;
    }

    if (userDetails) {
      setProfile((prev) => ({
        ...prev,
        first_name: userDetails.first_name || "",
        last_name: userDetails.last_name || "",
        mobile: userDetails.mobile || "",
        postcode: userDetails.postcode || "",
      }));
    }
  }, [user, userDetails, authLoading, router]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      await refreshUser();

      toast.success("Logged out successfully");

      router.push("/");
    } catch (err) {
      toast.error("Logout failed ❌");
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        mobile: profile.mobile,
        postcode: profile.postcode,
      });
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in both new password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setUpdatingPassword(true);
    try {
      await authService.updatePassword(passwordData.newPassword);

      toast.success("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your account settings and view your orders</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-orange-600" />
                  </div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">Active Member</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  {(role === 'owner' || role === 'admin') && (
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 px-3 py-1.5 text-sm w-fit cursor-pointer"
                      onClick={() => router.push(role === 'admin' ? '/admin' : '/restaurant')}
                    >
                      Go to {role === 'admin' ? 'Admin Panel' : 'Restaurant Dashboard'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm w-fit cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue={role === 'customer' ? "orders" : "details"} className="space-y-6 ">
              <TabsList className={`grid w-full ${role === 'customer' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {role === 'customer' && <TabsTrigger value="orders" className="cursor-pointer">My Orders</TabsTrigger>}
                <TabsTrigger value="details" className="cursor-pointer">Details</TabsTrigger>
                <TabsTrigger value="password" className="cursor-pointer">Password</TabsTrigger>
              </TabsList>

              {/* My Orders Tab */}
              {role === 'customer' && (
                <TabsContent value="orders" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-orange-600" />
                        My Orders
                      </CardTitle>
                      <CardDescription>Your order history and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No orders yet</p>
                        <Button
                          onClick={() => router.push("/restaurants")}
                          className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
                        >
                          Start Ordering
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-600" />
                      Account Details
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input value={user.email} disabled />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Forename
                        </label>
                        <Input
                          value={profile.first_name}
                          onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                          placeholder="Enter your forename"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Surname
                        </label>
                        <Input
                          value={profile.last_name}
                          onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                          placeholder="Enter your surname"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile
                        </label>
                        <Input
                          value={profile.mobile}
                          onChange={(e) => setProfile((p) => ({ ...p, mobile: e.target.value }))}
                          placeholder="Enter your mobile number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postcode
                        </label>
                        <Input
                          value={profile.postcode}
                          onChange={(e) => setProfile((p) => ({ ...p, postcode: e.target.value }))}
                          placeholder="Enter your postcode"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Checkbox
                          id="emailOpt"
                          name="emailOpt"
                          checked={profile.emailOpt}
                          onChange={(e) => {
                            const { checked } = e.currentTarget;
                            setProfile((p) => ({ ...p, emailOpt: checked }));
                          }}
                        />
                        <label htmlFor="emailOpt" className="ml-2 text-sm text-gray-600">
                          Receive email offers
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="smsOpt"
                          name="smsOpt"
                          checked={profile.smsOpt}
                          onChange={(e) => {
                            const { checked } = e.currentTarget;
                            setProfile((p) => ({ ...p, smsOpt: checked }));
                          }}
                        />
                        <label htmlFor="smsOpt" className="ml-2 text-sm text-gray-600">
                          Receive SMS offers
                        </label>
                      </div>
                    </div>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-gray-700">Preferred communication</legend>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="prefEmail"
                          checked={profile.prefEmail}
                          onChange={() =>
                            setProfile((p) => ({ ...p, prefEmail: true, prefText: false }))
                          }
                          className="h-4 w-4 text-orange-600 border-gray-300"
                        />
                        <label className="ml-2 text-sm text-gray-600">Email</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="prefText"
                          checked={profile.prefText}
                          onChange={() =>
                            setProfile((p) => ({ ...p, prefText: true, prefEmail: false }))
                          }
                          className="h-4 w-4 text-orange-600 border-gray-300"
                        />
                        <label className="ml-2 text-sm text-gray-600">Text message</label>
                      </div>
                    </fieldset>

                    <Button
                      onClick={handleSaveDetails}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-orange-600" />
                      Change Password
                    </CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>

                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
                      onClick={handleUpdatePassword}
                      disabled={updatingPassword}
                    >
                      {updatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
