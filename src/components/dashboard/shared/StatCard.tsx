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
    <div className="bg-white rounded-2xl border border-gray-100 p-4 xl:p-5 flex items-start gap-3 shadow-sm min-w-0">
      <div className={cn("p-2 xl:p-2.5 rounded-xl shrink-0", colorMap[color])}>
        <Icon className="w-4 h-4 xl:w-5 xl:h-5" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-xs xl:text-sm text-gray-500 leading-snug">{label}</p>
        <p className="text-lg xl:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {trend && (
          <p className={cn("text-[10px] xl:text-xs mt-1 font-medium leading-tight", trend.positive ? "text-green-600" : "text-red-500")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
