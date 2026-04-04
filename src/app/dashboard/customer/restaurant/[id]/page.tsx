import { notFound } from "next/navigation";
import { getRestaurants } from "@/data/restaurants";
import RestaurantMenuView from "@/components/dashboard/customer/RestaurantMenuView";
import { ALL_SITES } from "@/config/sites";
import { db } from "@/lib/db";
import { restaurants, menuItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let restaurantData: any = null;
  let DBMenuItems: any[] = [];

  // 1. Try to find in Database (Admin-added)
  try {
    const [dbRes] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));

    if (dbRes) {
      restaurantData = {
        ...dbRes,
        image: dbRes.logoUrl, // Map logoUrl to image for compatibility
        cuisine: "Restaurant", // Default cuisine if not in DB
      };

      // Fetch menu items for this restaurant
      DBMenuItems = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, id))
        .orderBy(menuItems.category);
    }
  } catch (err) {
    console.error("Failed to fetch restaurant from DB:", err);
  }

  // 2. Fallback to mock data if not in DB
  if (!restaurantData) {
    restaurantData = ALL_SITES.flatMap((s) => getRestaurants(s.key)).find(
      (r) => r.id === id
    );
  }

  if (!restaurantData) notFound();

  return (
    <RestaurantMenuView 
      restaurant={restaurantData} 
      initialMenuItems={DBMenuItems.length > 0 ? DBMenuItems : undefined}
    />
  );
}
