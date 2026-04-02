import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminPayments from "@/components/dashboard/admin/AdminPayments";

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminPayments />;
}
