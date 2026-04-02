import { ShoppingBag, Users, Truck, UtensilsCrossed } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import StatCard from "@/components/dashboard/shared/StatCard";
import PageHeader from "@/components/dashboard/shared/PageHeader";

const recentOrders = [
  { id: "#1042", customer: "John Mullan",    restaurant: "The Anchor Bar",    status: "Delivered",    amount: "£18.50" },
  { id: "#1041", customer: "Sarah Quinn",    restaurant: "Pizza Palace",       status: "Preparing",    amount: "£24.00" },
  { id: "#1040", customer: "Peter Fitzpatrick", restaurant: "Burger Barn",     status: "Out for delivery", amount: "£15.99" },
  { id: "#1039", customer: "Marie O'Brien", restaurant: "Sushi Station",       status: "Delivered",    amount: "£31.00" },
];

const statusColor: Record<string, string> = {
  "Delivered":          "bg-green-100 text-green-700",
  "Preparing":          "bg-amber-100 text-amber-700",
  "Out for delivery":   "bg-blue-100 text-blue-700",
  "Pending":            "bg-gray-100 text-gray-600",
};

export default function AdminOverview({ user }: { user: SessionUser }) {
  return (
    <div>
      <PageHeader
        title="Admin Overview"
        subtitle="Site management and daily operations"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Orders Today"   value="98"  icon={ShoppingBag}     color="blue"  trend={{ value: "14% vs yesterday", positive: true }} />
        <StatCard label="Restaurants"    value="35"  icon={UtensilsCrossed} color="green" />
        <StatCard label="Active Drivers" value="12"  icon={Truck}           color="amber" />
        <StatCard label="Customers"      value="420" icon={Users}           color="purple" />
      </div>

      {/* Recent orders */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Orders</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 font-semibold text-gray-500">Order</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Customer</th>
                <th className="px-5 py-3 font-semibold text-gray-500 hidden md:table-cell">Restaurant</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-gray-700">{order.id}</td>
                  <td className="px-5 py-3.5 text-gray-900">{order.customer}</td>
                  <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{order.restaurant}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
