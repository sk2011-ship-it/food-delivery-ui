import { requireRole } from "@/lib/auth";
import CustomerSearch from "@/components/dashboard/customer/CustomerSearch";

export default async function CustomerSearchPage() {
  await requireRole(["customer"]);
  return <CustomerSearch />;
}
