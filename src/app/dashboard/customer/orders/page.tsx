import { requireRole } from "@/lib/auth";
import CustomerOrders from "@/components/dashboard/customer/CustomerOrders";

export default async function CustomerOrdersPage() {
  const user = await requireRole(["customer"]);
  return <CustomerOrders user={user} />;
}
