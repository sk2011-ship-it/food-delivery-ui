import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSupport from "@/components/dashboard/admin/AdminSupport";

export default async function AdminSupportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminSupport />;
}
