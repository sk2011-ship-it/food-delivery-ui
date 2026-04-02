"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, Bell } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

const roleBadge: Record<string, string> = {
  owner:    "bg-purple-100 text-purple-700",
  admin:    "bg-blue-100 text-blue-700",
  driver:   "bg-amber-100 text-amber-700",
  customer: "bg-orange-100 text-orange-600",
};

export default function DashboardHeader({
  user,
  onMenuClick,
  hideMenuButton = false,
}: {
  user: SessionUser;
  onMenuClick: () => void;
  hideMenuButton?: boolean;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout();
    toast.success("Logged out.");
    router.push("/login");
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{
        background:   "var(--dash-header-bg)",
        borderBottom: "1px solid var(--dash-header-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={`${hideMenuButton ? "hidden" : "lg:hidden"} p-2 rounded-lg hover:bg-gray-100 transition-colors`}
        >
          <Menu className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
        </button>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
            Hi, {user.name.split(" ")[0]}
          </p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[user.role]}`}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: "var(--dash-text-secondary)" }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
