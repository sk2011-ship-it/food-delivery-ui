"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, TrendingUp, DollarSign, Store, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restaurantService } from "@/services/api";
import { Restaurant } from "@/types/restaurant";
import Link from "next/link";

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  restaurantRevenue: {
    restaurantId: string;
    restaurantName: string;
    revenue: number;
    orderCount: number;
  }[];
}

export default function RevenueDashboard() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    if (role !== "admin") return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [revenueRes, restaurants] = await Promise.all([
          restaurantService.getRevenue(),
          restaurantService.getAdminRestaurants()
        ]);

        const orders = revenueRes.orders;
        
        // Calculate metrics
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = orders.length;

        // Group by restaurant
        const restaurantMap: Record<string, { revenue: number; orderCount: number }> = {};
        orders.forEach(order => {
          if (!restaurantMap[order.restaurant_id]) {
            restaurantMap[order.restaurant_id] = { revenue: 0, orderCount: 0 };
          }
          restaurantMap[order.restaurant_id].revenue += order.total_amount;
          restaurantMap[order.restaurant_id].orderCount += 1;
        });

        // Map to display format with names
        const restaurantRevenue = Object.entries(restaurantMap).map(([id, stats]) => {
          const restaurant = restaurants.find(r => r.id === id);
          return {
            restaurantId: id,
            restaurantName: restaurant?.name || "Unknown Restaurant",
            revenue: stats.revenue,
            orderCount: stats.orderCount
          };
        }).sort((a, b) => b.revenue - a.revenue);

        setData({
          totalRevenue,
          totalOrders,
          restaurantRevenue
        });
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  if (role !== "admin") return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analyzing platform revenue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-50 border-slate-200 h-12 w-12 cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Revenue Dashboard</h1>
            <p className="text-slate-500 font-medium">Real-time platform earnings and order performance overview.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <DollarSign className="w-24 h-24 text-white" />
            </div>
            <CardContent className="pt-8 pb-10">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Total Platform Revenue</p>
                <h2 className="text-6xl font-black text-white italic tracking-tighter">
                  ${data?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <div className="flex items-center gap-2 mt-4 inline-flex px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-400">All-time earnings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xl overflow-hidden relative group border-2">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <ShoppingBag className="w-24 h-24 text-slate-900" />
            </div>
            <CardContent className="pt-8 pb-10">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Total Paid Orders</p>
                <h2 className="text-6xl font-black text-slate-900 italic tracking-tighter">
                  {data?.totalOrders}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-2">Successful transactions completed.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-6 h-6 text-orange-600" />
                  Restaurant Performance
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">Ranked by total revenue generated</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Restaurant</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Orders</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.restaurantRevenue.length ? data.restaurantRevenue.map((r, i) => (
                    <tr key={r.restaurantId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                              {i + 1}
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{r.restaurantName}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className="font-medium text-slate-500">{r.orderCount} orders</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <span className="font-black text-slate-900 tracking-tight text-lg">
                           ${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center text-slate-400 italic">
                         No paid orders detected on the platform yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
