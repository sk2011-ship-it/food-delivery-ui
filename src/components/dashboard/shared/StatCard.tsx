import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: "purple" | "blue" | "amber" | "green" | "red";
}

const colorMap = {
  purple: "bg-purple-50 text-purple-600",
  blue:   "bg-blue-50 text-blue-600",
  amber:  "bg-amber-50 text-amber-600",
  green:  "bg-green-50 text-green-600",
  red:    "bg-red-50 text-red-600",
};

export default function StatCard({ label, value, icon: Icon, trend, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.positive ? "text-green-600" : "text-red-500")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
