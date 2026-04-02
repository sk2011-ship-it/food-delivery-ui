import { requireRole } from "@/lib/auth";
import OwnerOverview from "@/components/dashboard/owner/OwnerOverview";

export default async function OwnerDashboardPage() {
  const user = await requireRole(["owner"]);
  return <OwnerOverview user={user} />;
}
