import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminFeatured from "@/components/dashboard/admin/AdminFeatured";

export default async function AdminFeaturedPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminFeatured />;
}
