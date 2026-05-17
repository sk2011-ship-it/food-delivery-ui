import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerSupport from "@/components/dashboard/owner/OwnerSupport";

export default async function OwnerSupportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");
  return <OwnerSupport />;
}
