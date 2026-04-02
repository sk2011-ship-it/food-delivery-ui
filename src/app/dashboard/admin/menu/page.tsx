import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminMenu from "@/components/dashboard/admin/AdminMenu";

export default async function AdminMenuPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminMenu />;
}
