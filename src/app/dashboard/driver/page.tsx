import { requireRole } from "@/lib/auth";
import DriverOverview from "@/components/dashboard/driver/DriverOverview";

export default async function DriverDashboardPage() {
  const user = await requireRole(["driver"]);
  return <DriverOverview user={user} />;
}
