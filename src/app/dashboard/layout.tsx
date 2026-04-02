import { requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  // Customer has its own layout (CustomerShell) defined in
  // src/app/dashboard/customer/layout.tsx — skip the sidebar-based DashboardLayout.
  if (user.role === "customer") {
    return <>{children}</>;
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
