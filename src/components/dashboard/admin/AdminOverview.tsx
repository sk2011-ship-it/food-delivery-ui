"use client";

import { ShoppingBag, Users, Truck, UtensilsCrossed, PoundSterling } from "lucide-react";
import StatCard from "@/components/dashboard/shared/StatCard";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { useAdminOrders } from "@/context/AdminOrderContext";
import { STATUS_META } from "./AdminOrders";

export default function AdminOverview() {
  const { orders, stats, loading } = useAdminOrders();

  // Show only 5 latest orders on overview
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        subtitle="Site management and daily operations"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Total Revenue"   
          value={`£${parseFloat(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}  
          icon={PoundSterling}     
          color="green" 
        />
        <StatCard 
          label="Total Orders"    
          value={String(stats.totalOrders)}  
          icon={ShoppingBag} 
          color="blue" 
        />
        <StatCard 
          label="Pending Units" 
          value={String(stats.pendingOrders)}  
          icon={Truck}           
          color="amber" 
        />
        <StatCard 
          label="Customers"      
          value={String(stats.totalCustomers)}
          icon={Users}           
          color="purple" 
        />
      </div>

      {/* Recent orders */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Orders</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                <th className="px-5 py-3 font-semibold text-gray-500">Order</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Customer</th>
                <th className="px-5 py-3 font-semibold text-gray-500 hidden md:table-cell">Restaurant</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">Loading data...</td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No orders found.</td>
                </tr>
              ) : recentOrders.map((order) => {
                const meta = STATUS_META[order.status] || { label: order.status, color: "#000", bg: "#f3f4f6" };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-gray-700 text-[10px]">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{order.user?.name ?? "Deleted User"}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{order.restaurant?.name ?? "Deleted Restaurant"}</td>
                    <td className="px-5 py-3.5">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      £{parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
