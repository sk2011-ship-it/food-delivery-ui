import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminAnalytics from "@/components/dashboard/admin/AdminAnalytics";

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminAnalytics />;
}
