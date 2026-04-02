import { requireAuth, dashboardPath } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireAuth();
  redirect(dashboardPath(user.role));
}
