// @ts-nocheck
import { db } from "../src/lib/db/index";
import { users } from "../src/lib/db/schema/users";
import { restaurants } from "../src/lib/db/schema/restaurants";
import { eq } from "drizzle-orm";

async function main() {
  const allUsers = await db.select().from(users).where(eq(users.email, "Owner01@gmail.com"));
  console.log("--- Users ---");
  console.log(JSON.stringify(allUsers, null, 2));
  
  if (allUsers.length > 0) {
    const userId = allUsers[0].id;
    const allRests = await db.select().from(restaurants).where(eq(restaurants.ownerId, userId));
    console.log("--- Restaurants for user ---");
    console.log(JSON.stringify(allRests, null, 2));
    
    if (allRests.length === 0) {
      console.log("No restaurants found for this owner. Checking total restaurants...");
      const totalRests = await db.select().from(restaurants);
      console.log("Total restaurants in DB:", totalRests.length);
      if (totalRests.length > 0) {
        console.log("Sample restaurant ownerId:", totalRests[0].ownerId);
      }
    }
  }
}

main().catch(console.error);
