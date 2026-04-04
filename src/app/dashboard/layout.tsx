import { getCurrentUser, requireAuth } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // If there's no user, or it's a customer, we let them proceed.
  // The customer layout/pages will handle their own auth checks if they access protected areas.
  // src/middleware.ts handles redirecting unauthorized users from protected routes.
  if (!user || user.role === "customer") {
    return <>{children}</>;
  }

  // Admin/Owner/Driver use the shared dashboard layout
  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
