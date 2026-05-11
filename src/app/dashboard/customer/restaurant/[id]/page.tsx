import { notFound } from "next/navigation";
import RestaurantMenuView from "@/components/dashboard/customer/RestaurantMenuView";
import { ALL_SITES } from "@/config/sites";
import { db } from "@/lib/db";
import { restaurants, menuItems, reviews, users } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let restaurantData: any = null;
  let DBMenuItems: any[] = [];
  let DBReviews: any[] = [];

  // 1. Try to find in Database (Admin-added)
  try {
    const [dbRes] = await db
      .select()
      .from(restaurants)
      .where(
        and(
          eq(restaurants.id, id),
          eq(restaurants.status, "active"),
          eq(restaurants.isActive, true),
          isNull(restaurants.deletionStatus)
        )
      );

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
        .where(
          and(
            eq(menuItems.restaurantId, id),
            eq(menuItems.status, "available")
          )
        )
        .orderBy(menuItems.category);

      // Fetch active reviews for this restaurant
      DBReviews = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          userName: users.name,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(
          and(
            eq(reviews.restaurantId, id),
            eq(reviews.status, "active")
          )
        )
        .orderBy(desc(reviews.createdAt));
    }
  } catch (err) {
    console.error("Failed to fetch restaurant or reviews from DB:", err);
  }

  if (!restaurantData) notFound();

  return (
      <RestaurantMenuView 
        restaurant={restaurantData} 
        initialMenuItems={DBMenuItems.length > 0 ? DBMenuItems : undefined}
        reviews={DBReviews}
      />
  );
}
