import { requireRole } from "@/lib/auth";
import AdminOverview from "@/components/dashboard/admin/AdminOverview";

export default async function AdminDashboardPage() {
  const user = await requireRole(["admin"]);
  return <AdminOverview user={user} />;
}
