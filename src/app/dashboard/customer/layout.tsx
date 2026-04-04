import { getCurrentUser } from "@/lib/auth";
import CustomerShell from "@/components/dashboard/customer/CustomerShell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getCurrentUser returns null for guests — no redirect for public pages
  const user = await getCurrentUser();
  return <CustomerShell user={user}>{children}</CustomerShell>;
}
