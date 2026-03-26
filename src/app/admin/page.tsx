"use client";

import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Store, ShoppingBag, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user, role } = useAuth();

  if (role !== "admin") return null;

  const stats = [
    { title: "Total Users", value: "1,250", icon: Users, color: "text-blue-600" },
    { title: "Active Restaurants", value: "48", icon: Store, color: "text-green-600" },
    { title: "Today's Orders", value: "156", icon: ShoppingBag, color: "text-orange-600" },
    { title: "System Alerts", value: "2", icon: ShieldAlert, color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.email}. You have full system access.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>Manage global settings and user roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Use the administrative tools to monitor platform health, manage restaurant approvals, and resolve user issues.
              </p>
              <div className="flex gap-4">
                <Button className="bg-orange-600 hover:bg-orange-700">Manage Users</Button>
                <Button variant="outline">System Logs</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system-wide events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <p className="text-gray-700">New restaurant "Pizza Heaven" registered for review.</p>
                    <span className="text-gray-400 ml-auto">2h ago</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
