import { requireRole } from "@/lib/auth";
import CustomerSettings from "@/components/dashboard/customer/CustomerSettings";

export default async function CustomerSettingsPage() {
  const user = await requireRole(["customer"]);
  return <CustomerSettings user={user} />;
}
