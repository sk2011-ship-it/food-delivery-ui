import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getRestaurants } from "@/data/restaurants";
import RestaurantMenuView from "@/components/dashboard/customer/RestaurantMenuView";
import { ALL_SITES } from "@/config/sites";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["customer"]);
  const { id } = await params;

  // Find restaurant across all sites
  const restaurant = ALL_SITES.flatMap((s) => getRestaurants(s.key)).find(
    (r) => r.id === id
  );

  if (!restaurant) notFound();

  return <RestaurantMenuView restaurant={restaurant} />;
}
