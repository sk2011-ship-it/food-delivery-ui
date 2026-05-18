import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OwnerSupport from "@/components/dashboard/owner/OwnerSupport";

export default async function OwnerSupportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");

  // Fetch the owner's primary restaurant to get location
  const [restaurant] = await db
    .select({ location: restaurants.location })
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.id))
    .limit(1);

  return <OwnerSupport location={restaurant?.location ?? null} />;
}
