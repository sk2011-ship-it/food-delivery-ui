"use client";

import { MapPin, CheckCircle2, Clock, Banknote } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import StatCard from "@/components/dashboard/shared/StatCard";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { useState } from "react";

const activeDeliveries = [
  { id: "#1041", customer: "Sarah Quinn",    address: "14 Main St, Kilkeel", restaurant: "Pizza Palace",  eta: "8 min",  status: "Picking up" },
  { id: "#1042", customer: "Tom McAlister",  address: "6 Shore Rd, Kilkeel", restaurant: "The Anchor Bar", eta: "15 min", status: "Delivering" },
];

export default function DriverOverview({ user }: { user: SessionUser }) {
  const [available, setAvailable] = useState(true);

  return (
    <div>
      <PageHeader
        title="Driver Overview"
        subtitle="Your deliveries and earnings today"
        action={
          <button
            onClick={() => setAvailable(!available)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              available
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {available ? "● Available" : "○ Offline"}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Deliveries Today" value="7"      icon={CheckCircle2} color="green"  trend={{ value: "2 more than yesterday", positive: true }} />
        <StatCard label="Active Orders"    value="2"      icon={MapPin}       color="blue"   />
        <StatCard label="Avg. Time"        value="22 min" icon={Clock}        color="amber"  />
        <StatCard label="Earnings Today"   value="£48"    icon={Banknote}     color="purple" trend={{ value: "+£12 vs yesterday", positive: true }} />
      </div>

      {/* Active deliveries */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Active Deliveries</h2>
      <div className="space-y-3">
        {activeDeliveries.map((delivery) => (
          <div key={delivery.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
            <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">{delivery.customer}</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{delivery.status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{delivery.address}</p>
              <p className="text-xs text-gray-400 mt-1">{delivery.restaurant} · ETA {delivery.eta}</p>
            </div>
            <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shrink-0">
              Done
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
