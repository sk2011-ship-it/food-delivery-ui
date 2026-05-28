/**
 * seed-downpatrick-menus.ts
 * Seeds REAL scraped menu data from scraper/downpatrick_menus.json
 * into the database for all Downpatrick restaurants.
 *
 * Run: npx tsx scripts/seed-downpatrick-menus.ts
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { restaurants } from "../src/lib/db/schema/restaurants";
import { menuItems } from "../src/lib/db/schema/menuItems";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

config();

// ─── Category image map ─────────────────────────────────────────────────────
const IMAGES: Record<string, string> = {
  burger:       "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
  chips:        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80",
  pizza:        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
  garlicBread:  "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80",
  friedChicken: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80",
  kebab:        "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&q=80",
  donut:        "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80",
  iceCream:     "https://images.unsplash.com/photo-1501443762594-e21e1af24da6?w=500&q=80",
  waffle:       "https://images.unsplash.com/photo-1562376502-6f769499c886?w=500&q=80",
  indianCurry:  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80",
  naanBread:    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&q=80",
  fishAndChips: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
  nachos:       "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80",
  coffee:       "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80",
  pastry:       "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
  breakfast:    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80",
  pubSteak:     "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
  soda:         "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
  shake:        "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
  bakedPotato:  "https://images.unsplash.com/photo-1536737526084-257a07525381?w=500&q=80",
  wine:         "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80",
  spirit:       "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&q=80",
  beer:         "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&q=80",
  chinese:      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80",
  deal:         "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
  default:      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80"
};

function pickImage(restaurantName: string, itemName: string, category: string): string {
  const nameLower = itemName.toLowerCase();
  const catLower = category.toLowerCase();

  // Specific item name overrides (most reliable signal)
  if (nameLower.includes("garlic bread") || nameLower.includes("garlic slice")) return IMAGES.garlicBread;
  if (nameLower.includes("nacho") || nameLower.includes("salsa") || nameLower.includes("guac")) return IMAGES.nachos;
  if (nameLower.includes("deal") || nameLower.includes("box") || nameLower.includes("platter")) return IMAGES.deal;
  if (nameLower.includes("curry") || nameLower.includes("masala") || nameLower.includes("rogan") || nameLower.includes("korma")) return IMAGES.indianCurry;
  if (nameLower.includes("naan") || nameLower.includes("roti")) return IMAGES.naanBread;
  if (nameLower.includes("noodle") || nameLower.includes("chow mein") || nameLower.includes("fried rice")) return IMAGES.chinese;
  if (nameLower.includes("donut") || nameLower.includes("doughnut")) return IMAGES.donut;
  if (nameLower.includes("waffle") || nameLower.includes("crepe")) return IMAGES.waffle;
  if (nameLower.includes("ice cream") || nameLower.includes("gelato") || nameLower.includes("scoop") || nameLower.includes("sorbet") || nameLower.includes("sundae")) return IMAGES.iceCream;
  if (nameLower.includes("shake") || nameLower.includes("milkshake") || nameLower.includes("smoothie")) return IMAGES.shake;
  if (nameLower.includes("coffee") || nameLower.includes("latte") || nameLower.includes("cappuccino") || nameLower.includes("tea")) return IMAGES.coffee;
  if (nameLower.includes("pastry") || nameLower.includes("scone") || nameLower.includes("cake") || nameLower.includes("muffin") || nameLower.includes("brownie") || nameLower.includes("churro")) return IMAGES.pastry;
  if (nameLower.includes("steak") || nameLower.includes("sirloin") || nameLower.includes("grill")) return IMAGES.pubSteak;
  if (nameLower.includes("potato") || nameLower.includes("spud") || nameLower.includes("baked")) return IMAGES.bakedPotato;
  if (nameLower.includes("chip") || nameLower.includes("fries") || nameLower.includes("wedge")) return IMAGES.chips;
  if (nameLower.includes("wine") || nameLower.includes("prosecco") || nameLower.includes("champagne") || nameLower.includes("shiraz") || nameLower.includes("sauvignon") || nameLower.includes("merlot")) return IMAGES.wine;
  if (nameLower.includes("beer") || nameLower.includes("lager") || nameLower.includes("cider") || nameLower.includes("ale") || nameLower.includes("stout")) return IMAGES.beer;
  if (nameLower.includes("spirit") || nameLower.includes("vodka") || nameLower.includes("gin") || nameLower.includes("whiskey") || nameLower.includes("rum")) return IMAGES.spirit;

  // Category-level fallback
  if (catLower === "pizzas") return IMAGES.pizza;
  if (catLower === "burgers") return IMAGES.burger;
  if (catLower === "chicken") return IMAGES.friedChicken;
  if (catLower === "fish & seafood") return IMAGES.fishAndChips;
  if (catLower === "mexican") return IMAGES.nachos;
  if (catLower === "breakfast") return IMAGES.breakfast;
  if (catLower === "kebabs & wraps") return IMAGES.kebab;
  if (catLower === "chinese") return IMAGES.chinese;
  if (catLower === "drinks") {
    if (nameLower.includes("wine") || nameLower.includes("prosecco") || nameLower.includes("champagne")) return IMAGES.wine;
    if (nameLower.includes("spirit") || nameLower.includes("vodka") || nameLower.includes("gin") || nameLower.includes("whiskey") || nameLower.includes("rum")) return IMAGES.spirit;
    if (nameLower.includes("beer") || nameLower.includes("lager") || nameLower.includes("stout") || nameLower.includes("ale") || nameLower.includes("cider")) return IMAGES.beer;
    return IMAGES.soda;
  }
  if (catLower === "desserts") return IMAGES.waffle;
  if (catLower === "sides") return IMAGES.chips;

  // Item name broad fallback
  if (nameLower.includes("chicken") || nameLower.includes("wing") || nameLower.includes("strip") || nameLower.includes("nugget") || nameLower.includes("dipper")) return IMAGES.friedChicken;
  if (nameLower.includes("burger") || nameLower.includes("wrap") || nameLower.includes("big mac")) return IMAGES.burger;
  if (nameLower.includes("pizza") || nameLower.includes("margherita") || nameLower.includes("pepperoni")) return IMAGES.pizza;
  if (nameLower.includes("fish") || nameLower.includes("cod") || nameLower.includes("haddock") || nameLower.includes("scampi")) return IMAGES.fishAndChips;
  if (nameLower.includes("kebab") || nameLower.includes("shish") || nameLower.includes("doner")) return IMAGES.kebab;
  if (nameLower.includes("bacon") || nameLower.includes("sausage") || nameLower.includes("egg") || nameLower.includes("pancake") || nameLower.includes("benedict")) return IMAGES.breakfast;
  if (nameLower.includes("spring roll") || nameLower.includes("duck") || nameLower.includes("dim sum") || nameLower.includes("szechuan")) return IMAGES.chinese;
  if (nameLower.includes("coke") || nameLower.includes("fanta") || nameLower.includes("sprite") || nameLower.includes("juice") || nameLower.includes("water") || nameLower.includes("can") || nameLower.includes("bottle")) return IMAGES.soda;

  return IMAGES.default;
}

// ─── Price parser ────────────────────────────────────────────────────────────
function parsePrice(raw: string): string | null {
  if (!raw) return null;
  // Extract first £X.XX value
  const match = raw.match(/£([\d]+\.[\d]{2})/);
  if (match) return match[1];
  // Extract £X value (no pence)
  const match2 = raw.match(/£([\d]+)/);
  if (match2) return `${match2[1]}.00`;
  // "From £X.XX" → take the number
  const match3 = raw.match(/From\s+£?([\d]+\.[\d]{2})/i);
  if (match3) return match3[1];
  return null;
}

// ─── Noise filter ────────────────────────────────────────────────────────────
const NOISE_NAMES = new Set([
  "next", "back", "order", "change", "n/a", "from", "categories", ""
]);

function isNoise(name: string): boolean {
  const n = name.toLowerCase().trim();
  if (NOISE_NAMES.has(n)) return true;
  if (n.length < 2) return true;
  // Pure number
  if (/^\d+$/.test(n)) return true;
  // Single punctuation
  if (/^[×\-–—]+$/.test(n)) return true;
  return false;
}

function categorizeMenuItem(name: string, description: string, restaurantName: string): string {
  const nameLower = name.toLowerCase();
  const descLower = (description || "").toLowerCase();
  const combined = `${nameLower} ${descLower}`;

  // 1. Specific restaurants first
  const restLower = restaurantName.toLowerCase();
  if (restLower.includes("kwm wines") || restLower.includes("kwm wine")) {
    return "Drinks";
  }
  if (restLower.includes("nugelato") || restLower.includes("sucos")) {
    if (nameLower.includes("acai") || nameLower.includes("smoothie") || nameLower.includes("juice") || nameLower.includes("bowl")) {
      return "Acai & Smoothies";
    }
    return "Desserts";
  }
  if (restLower.includes("black box donut")) {
    return "Desserts";
  }

  // 2. Pizzas
  if (nameLower.includes("pizza") || nameLower.includes("margherita") || nameLower.includes("pepperoni") || nameLower.startsWith("7\"") || nameLower.startsWith("10\"") || nameLower.startsWith("12\"") || nameLower.startsWith("14\"")) {
    return "Pizzas";
  }

  // 3. Drinks
  const drinkKeywords = ["coke", "fanta", "sprite", "soda", "water", "drink", "juice", "can", "bottle", "coffee", "latte", "cappuccino", "espresso", "tea", "beverage", "wine", "beer", "cider", "vodka", "gin", "spirit", "whiskey", "rum", "liqueur", "prosecco", "champagne", "schweppes", "shiraz", "sauvignon", "pinot", "merlot", "schwepps", "tonic"];
  let matchedKeyword = "";
  for (const kw of drinkKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(nameLower)) {
      matchedKeyword = kw;
      break;
    }
  }
  if (matchedKeyword) {
    if (!nameLower.includes("chicken") && !nameLower.includes("burger") && !nameLower.includes("pizza") && !nameLower.includes("steak") && !nameLower.includes("fish") && !nameLower.includes("fry")) {
      return "Drinks";
    }
  }

  // 4. Burgers
  if (nameLower.includes("burger") || nameLower.includes("bap") || nameLower.includes("bun") || nameLower.includes("big mac")) {
    return "Burgers";
  }

  // 5. Kebabs & Wraps
  if (nameLower.includes("kebab") || nameLower.includes("shish") || nameLower.includes("doner") || nameLower.includes("wrap")) {
    return "Kebabs & Wraps";
  }

  // 6. Mexican
  if (nameLower.includes("taco") || nameLower.includes("burrito") || nameLower.includes("nacho") || nameLower.includes("quesadilla") || nameLower.includes("fajita")) {
    return "Mexican";
  }

  // 7. Fish & Chips / Seafood
  if (nameLower.includes("fish") || nameLower.includes("cod") || nameLower.includes("haddock") || nameLower.includes("scampi") || nameLower.includes("squid") || nameLower.includes("langoustines") || nameLower.includes("chowder") || nameLower.includes("prawn")) {
    return "Fish & Seafood";
  }

  // 8. Chicken
  if (nameLower.includes("chicken") || nameLower.includes("wing") || nameLower.includes("strip") || nameLower.includes("nugget") || nameLower.includes("tender") || nameLower.includes("goujon") || nameLower.includes("breast") || nameLower.includes("drumstick") || nameLower.includes("thigh")) {
    return "Chicken";
  }

  // 9. Sauces & Dips
  if (nameLower.includes("sauce") || nameLower.includes("dip") || nameLower.includes("mayo") || nameLower.includes("gravy") || nameLower.includes("coleslaw") || nameLower === "curry" || nameLower === "ketchup" || nameLower.includes("chilli jam") || nameLower.includes("condiments")) {
    const isMainDish = nameLower.includes("chicken") || nameLower.includes("beef") || nameLower.includes("pork") || nameLower.includes("duck") || nameLower.includes("prawn") || nameLower.includes("squid") || nameLower.includes("steak") || nameLower.includes("pasta") || nameLower.includes("fillet") || nameLower.includes("chow mein") || nameLower.includes("chop suey") || nameLower.includes("ribs") || nameLower.includes("char siu");
    if (!isMainDish) {
      return "Sauces & Dips";
    }
  }

  // 10. Breakfast
  if (nameLower.includes("breakfast") || nameLower.includes("fry") || nameLower.includes("bacon") || nameLower.includes("sausage") || nameLower.includes("egg") || nameLower.includes("toast") || nameLower.includes("soda bread") || nameLower.includes("potato bread") || nameLower.includes("pancake") || nameLower.includes("avocado") || nameLower.includes("granola") || nameLower.includes("mcmuffin")) {
    return "Breakfast";
  }

  // 11. Asian / Chinese / Curries
  if (nameLower.includes("curry") || nameLower.includes("noodle") || nameLower.includes("chow mein") || nameLower.includes("rice") || nameLower.includes("dim sum") || nameLower.includes("spring roll") || nameLower.includes("masala") || nameLower.includes("korma") || nameLower.includes("satay") || nameLower.includes("szechuan") || nameLower.includes("peking") || nameLower.includes("cantonese") || nameLower.includes("chop suey") || nameLower.includes("duck") || nameLower.includes("aromatic")) {
    if (nameLower.includes("chips")) {
      return "Sides"; // e.g. curry chips
    }
    return "Curries & Asian";
  }

  // 12. Desserts & Sweets
  if (nameLower.includes("waffle") || nameLower.includes("crepe") || nameLower.includes("cookie") || nameLower.includes("ice cream") || nameLower.includes("gelato") || nameLower.includes("sweet") || nameLower.includes("dessert") || nameLower.includes("donut") || nameLower.includes("pudding") || nameLower.includes("fondant") || nameLower.includes("shake") || nameLower.includes("smoothie") || nameLower.includes("slush") || nameLower.includes("cake") || nameLower.includes("muffin") || nameLower.includes("brownie") || nameLower.includes("churro") || nameLower.includes("sundae") || nameLower.includes("fudge") || nameLower.includes("sorbet") || nameLower.includes("chocolate") || nameLower.includes("whip") || nameLower.includes("cone") || nameLower.includes("nuggy pot") || nameLower.includes("pint pot") || nameLower.includes("acai")) {
    return "Desserts";
  }

  // 13. Sides
  if (nameLower.includes("chip") || nameLower.includes("fries") || nameLower.includes("wedge") || nameLower.includes("onion ring") || nameLower.includes("garlic bread") || nameLower.includes("potato") || nameLower.includes("spud") || nameLower.includes("salad") || nameLower.includes("side") || nameLower.includes("bread")) {
    return "Sides";
  }

  // Default
  return "Mains";
}

// ─── Clean items for one restaurant ─────────────────────────────────────────
interface RawItem { name: string; description: string; price: string }
interface CleanItem { name: string; description: string; category: string; price: string; imageUrl: string }

function cleanItems(
  restaurantName: string,
  categories: Array<{ category: string; items: RawItem[] }>,
  scrapedImages: Record<string, string> = {}
): CleanItem[] {
  const seen = new Set<string>();
  const result: CleanItem[] = [];

  for (const catBlock of categories) {
    const catName = catBlock.category === "General" ? "Menu" : catBlock.category;

    for (const item of catBlock.items) {
      // Skip navigation noise
      if (isNoise(item.name)) continue;

      // Skip items whose "name" looks like a price (£X.XX)
      if (/^£[\d]/.test(item.name.trim())) continue;

      const price = parsePrice(item.price);
      if (!price) continue; // Skip items with no valid price

      // Deduplicate by lowercase name
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      // If the description looks like a price, clear it
      let desc = item.description || "";
      if (/^£[\d]/.test(desc.trim())) desc = "";

      // Trim description noise
      desc = desc.replace(/\s+/g, " ").trim();
      if (desc.length > 300) desc = desc.substring(0, 297) + "...";

      let finalCat = catName;
      if (finalCat === "Menu" || finalCat === "General") {
        finalCat = categorizeMenuItem(item.name, desc, restaurantName);
      }

      const rawName = item.name.trim();
      const scrapedUrl = scrapedImages[rawName];
      const imageUrl = scrapedUrl || pickImage(restaurantName, item.name, finalCat);

      result.push({
        name: rawName,
        description: desc,
        category: finalCat,
        price,
        imageUrl,
      });
    }
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const imagesPath = path.join(__dirname, "../scraper/downpatrick_images.json");
  const scrapedImages: Record<string, string> = fs.existsSync(imagesPath)
    ? JSON.parse(fs.readFileSync(imagesPath, "utf-8"))
    : {};

  // Load scraped data
  const jsonPath = path.join(__dirname, "../scraper/downpatrick_menus.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ scraper/downpatrick_menus.json not found. Run scrape-all.js first.");
    process.exit(1);
  }
  const scraped = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Record<
    string,
    { name: string; status: string; categories?: Array<{ category: string; items: RawItem[] }> }
  >;

  console.log("Fetching Downpatrick restaurants from DB...");
  const dbRestaurants = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.location, "Downpatrick"));

  console.log(`Found ${dbRestaurants.length} restaurant(s) in Downpatrick.\n`);

  let totalInserted = 0;
  let totalSkipped  = 0;

  for (const [, scraped_r] of Object.entries(scraped)) {
    if (scraped_r.status !== "success" || !scraped_r.categories) {
      console.log(`⚠  Skipping "${scraped_r.name}" (status: ${scraped_r.status})`);
      totalSkipped++;
      continue;
    }

    // Match by name (exact case-insensitive match or fuzzy match excluding common stop words)
    const stopWords = ["the", "and", "a", "of", "in", "at", "to", "for", "with", "on", "by"];
    const dbMatch = dbRestaurants.find(dbr => {
      const dbN = dbr.name.toLowerCase().trim();
      const scrN = scraped_r.name.toLowerCase().trim();
      if (dbN === scrN) return true;

      const dbWords = dbN.split(/\s+/).filter(w => !stopWords.includes(w));
      const scrWords = scrN.split(/\s+/).filter(w => !stopWords.includes(w));
      if (dbWords.length > 0 && scrWords.length > 0) {
        return dbWords[0] === scrWords[0];
      }
      return false;
    });

    if (!dbMatch) {
      console.log(`⚠  No DB match for "${scraped_r.name}" — skipping (add restaurant first).`);
      totalSkipped++;
      continue;
    }

    // Clear all existing menu items (dummy or real) for this restaurant
    const existing = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, dbMatch.id));

    if (existing.length > 0) {
      console.log(`   Clearing ${existing.length} existing menu items for "${dbMatch.name}"...`);
      await db.delete(menuItems).where(eq(menuItems.restaurantId, dbMatch.id));
    }

    // Clean + validate
    const items = cleanItems(scraped_r.name, scraped_r.categories, scrapedImages);
    if (items.length === 0) {
      console.log(`⚠  "${scraped_r.name}" — no valid items after cleaning. Skipping.`);
      totalSkipped++;
      continue;
    }

    console.log(`→  Seeding "${dbMatch.name}" — ${items.length} items...`);

    const rows = items.map(item => ({
      restaurantId: dbMatch.id,
      name:         item.name,
      description:  item.description || "",
      category:     item.category,
      price:        item.price,
      imageUrl:     item.imageUrl,
      status:       "available" as const,
    }));

    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      await db.insert(menuItems).values(rows.slice(i, i + 50));
    }

    console.log(`   ✅ Inserted ${rows.length} items for "${dbMatch.name}"`);
    totalInserted += rows.length;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Done! Inserted ${totalInserted} items (${totalSkipped} restaurant(s) skipped).`);
  await client.end();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
