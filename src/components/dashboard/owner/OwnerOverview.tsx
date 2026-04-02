import { Globe, Users, Store, TrendingUp } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import StatCard from "@/components/dashboard/shared/StatCard";
import PageHeader from "@/components/dashboard/shared/PageHeader";

const sites = [
  { name: "Kilkeel Eats",      orders: 142, revenue: "£2,840", restaurants: 30, color: "bg-red-500" },
  { name: "Newcastle Eats",    orders: 98,  revenue: "£1,960", restaurants: 35, color: "bg-green-600" },
  { name: "Downpatrick Eats",  orders: 175, revenue: "£3,500", restaurants: 45, color: "bg-blue-600" },
];

export default function OwnerOverview({ user }: { user: SessionUser }) {
  return (
    <div>
      <PageHeader
        title="Owner Overview"
        subtitle="Platform-wide performance across all sites"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sites"        value="3"      icon={Globe}       color="purple" />
        <StatCard label="Total Restaurants"  value="110"    icon={Store}       color="blue"   />
        <StatCard label="Total Users"        value="1,240"  icon={Users}       color="green"  trend={{ value: "12% this month", positive: true }} />
        <StatCard label="Monthly Revenue"    value="£8,300" icon={TrendingUp}  color="amber"  trend={{ value: "8% vs last month", positive: true }} />
      </div>

      {/* Sites breakdown */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Sites Performance</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div key={site.name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${site.color}`} />
              <span className="font-semibold text-gray-900 text-sm">{site.name}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Orders today</span>
                <span className="font-semibold text-gray-900">{site.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Revenue today</span>
                <span className="font-semibold text-gray-900">{site.revenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Restaurants</span>
                <span className="font-semibold text-gray-900">{site.restaurants}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
