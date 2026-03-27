"use client";

import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Store, ShoppingBag, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { restaurantService } from "@/services/api";
import { Restaurant } from "@/types/restaurant";

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [restaurantCount, setRestaurantCount] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] = useState<Restaurant[]>([]);

  useEffect(() => {
    if (role === "admin") {
      Promise.all([
        restaurantService.getUsers(),
        restaurantService.getAdminRestaurants()
      ])
        .then(([users, restaurants]) => {
          setUserCount(users.length);
          setRestaurantCount(restaurants.length);

          const sortedRestaurants = [...restaurants]
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 3);
          
          setRecentActivity(sortedRestaurants);
        })
        .catch(console.error);
    }
  }, [role]);

  if (role !== "admin") return null;

  const stats = [
    { title: "Total Users", value: userCount !== null ? userCount.toString() : "...", icon: Users, color: "text-blue-600" },
    { title: "Active Restaurants", value: restaurantCount !== null ? restaurantCount.toString() : "...", icon: Store, color: "text-green-600" },
    { title: "Today's Orders", value: "0", icon: ShoppingBag, color: "text-orange-600" },
    { title: "System Alerts", value: "0", icon: ShieldAlert, color: "text-red-600" },
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
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                 <Link href="/admin/restaurants" className="group/btn">
                    <div className="p-6 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-orange-500/20 hover:bg-orange-50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <Store className="w-6 h-6 text-orange-600" />
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transform group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="font-black text-slate-900">Manage Restaurants</h4>
                      <p className="text-sm text-slate-500 mt-1">Configure stores, locations, and hierarchical menu data.</p>
                    </div>
                 </Link>
                 <Link href="/admin/users" className="group/btn">
                    <div className="p-6 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-blue-500/20 hover:bg-blue-50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="font-black text-slate-900">Manage Users</h4>
                      <p className="text-sm text-slate-500 mt-1">Review profiles and manage system-wide role permissions.</p>
                    </div>
                 </Link>
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((r, i) => (
                    <div key={r.id || i} className="flex items-center gap-4 py-2 border-b last:border-0 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <p className="text-gray-700">New restaurant <span className="font-bold">"{r.name}"</span> registered.</p>
                      <span className="text-gray-400 ml-auto whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-sm text-center py-4">No recent activity detected.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
