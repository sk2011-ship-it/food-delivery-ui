import { requireRole } from "@/lib/auth";
import CustomerCart from "@/components/dashboard/customer/CustomerCart";

export default async function CustomerCartPage() {
  const user = await requireRole(["customer"]);
  return <CustomerCart user={user} />;
}
