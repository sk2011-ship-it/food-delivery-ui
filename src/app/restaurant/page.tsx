"use client";

import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Utensils, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RestaurantDashboard() {
  const { user, role, userDetails } = useAuth();

  if (role !== "owner") return null;

  const stats = [
    { title: "Daily Orders", value: "24", icon: ShoppingBag, color: "text-orange-600" },
    { title: "Active Menu Items", value: "18", icon: Utensils, color: "text-blue-600" },
    { title: "Today's Revenue", value: "$456.00", icon: TrendingUp, color: "text-green-600" },
    { title: "Avg. Prep Time", value: "22m", icon: Clock, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {userDetails?.first_name || user?.email}. Manage your restaurant's orders and storefront settings.</p>
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
              <CardTitle>Manage Your Store</CardTitle>
              <CardDescription>Update your menu and shop settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                You can add new dishes, adjust prices, and set your opening hours. Keep your menu fresh to attract more customers.
              </p>
              <div className="flex gap-4">
                <Button className="bg-orange-600 hover:bg-orange-700">Update Menu</Button>
                <Button variant="outline">Settings</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Incoming Orders</CardTitle>
              <CardDescription>Real-time order tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-gray-700 font-medium">Order #102{i}</p>
                    <p className="text-gray-500">- 2x Burger Special</p>
                    <span className="text-gray-400 ml-auto mr-4">Pending</span>
                    <Button size="sm" variant="outline" className="h-8">Details</Button>
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
