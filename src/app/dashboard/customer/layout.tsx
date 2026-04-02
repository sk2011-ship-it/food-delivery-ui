import { requireRole } from "@/lib/auth";
import CustomerShell from "@/components/dashboard/customer/CustomerShell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["customer"]);
  return <CustomerShell user={user}>{children}</CustomerShell>;
}
