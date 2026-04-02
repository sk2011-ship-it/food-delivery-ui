import { requireRole } from "@/lib/auth";
import CustomerHome from "@/components/dashboard/customer/CustomerHome";

export default async function CustomerDashboardPage() {
  const user = await requireRole(["customer"]);
  return <CustomerHome user={user} />;
}
