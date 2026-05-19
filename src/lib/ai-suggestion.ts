/**
 * ai-suggestion.ts
 *
 * AI-powered alternative order suggestion engine.
 * Uses GPT-4o mini to select the best alternative from analytics-ranked candidates.
 *
 * Pipeline:
 *   1. Load current order (categories, location, items, total).
 *   2. Find active candidate restaurants in the same area (excluding current).
 *   3. Rank them by historical avg acceptance time from orderMetrics.
 *   4. Send top candidates + context to GPT-4o mini for final selection + reason.
 *   5. Return the chosen restaurant, its best matching dish, and a friendly explanation.
 *
 * Fully isolated — no side effects, no mutations.
 * Requires: OPENAI_API_KEY in environment variables.
 */

import OpenAI from "openai";
import { db } from "@/lib/db";
import { orders, orderItems, menuItems, restaurants, orderMetrics } from "@/lib/db/schema";
import { eq, and, ne, avg, isNotNull, inArray, sql, isNull } from "drizzle-orm";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AiSuggestion = {
  restaurantId: string;
  restaurantName: string;
  restaurantLogoUrl: string | null;
  avgAcceptanceMinutes: number;
  /** GPT-4o mini generated reason — friendly 1-sentence explanation for the customer */
  aiReason: string;
  dish: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
  };
};

type CandidateForAI = {
  restaurantId: string;
  restaurantName: string;
  avgAcceptanceMinutes: number;
  hasHistoricalData: boolean;
  dishes: Array<{ id: string; name: string; price: number; category: string }>;
};

// ── GPT-4o mini prompt ─────────────────────────────────────────────────────────

function buildPrompt(
  currentItems: string[],
  currentTotal: number,
  location: string,
  candidates: CandidateForAI[]
): string {
  const candidateList = candidates
    .map((c, i) =>
      [
        `${i + 1}. ${c.restaurantName}`,
        `   - Avg acceptance time: ${c.hasHistoricalData ? `${c.avgAcceptanceMinutes} min` : "no data yet (new restaurant)"}`,
        `   - Available dishes: ${c.dishes.map((d) => `${d.name} (${d.category}, £${d.price.toFixed(2)})`).join(", ")}`,
      ].join("\n")
    )
    .join("\n\n");

  return `You are a helpful food delivery assistant. A customer's order is taking too long to be accepted by the restaurant.

CURRENT ORDER:
- Items ordered: ${currentItems.join(", ")}
- Order total: £${currentTotal.toFixed(2)}
- Delivery area: ${location || "unknown"}
- Problem: Restaurant has not accepted the order in over 1 minute.

ALTERNATIVE RESTAURANTS (ranked by how fast they typically accept orders):
${candidateList}

YOUR TASK:
Choose the single best alternative restaurant for this customer. Prioritise:
1. Fastest acceptance time (lowest avg minutes).
2. Most similar dishes to what the customer originally ordered.
3. Closest price to the original order total.

Respond with ONLY valid JSON (no markdown, no explanation outside the JSON):
{
  "restaurantId": "<id of chosen restaurant>",
  "dishId": "<id of the single best matching dish from that restaurant>",
  "reason": "<one friendly sentence explaining why this is a great alternative, max 15 words>"
}`;
}

// ── Main function ──────────────────────────────────────────────────────────────

export async function getAlternativeSuggestion(orderId: string): Promise<AiSuggestion | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  // No key — we still run the analytics pipeline and fall back to top-ranked candidate

  // ── Step 1: Load current order + its restaurant's location ───────────────
  const [currentOrder] = await db
    .select({
      restaurantId: orders.restaurantId,
      deliveryArea: orders.deliveryArea,
      totalAmount: orders.totalAmount,
      status: orders.status,
      restaurantLocation: restaurants.location,
    })
    .from(orders)
    .innerJoin(restaurants, eq(restaurants.id, orders.restaurantId))
    .where(eq(orders.id, orderId))
    .limit(1);

  // Only suggest alternatives while the order is still unconfirmed
  if (!currentOrder || currentOrder.status !== "PENDING_CONFIRMATION") return null;

  // Use restaurant's actual location (authoritative) — deliveryArea is often empty in DB
  const locationFilter = currentOrder.restaurantLocation || currentOrder.deliveryArea;

  // ── Step 2: Get ordered item names + categories ────────────────────────────
  const itemRows = await db
    .select({ name: menuItems.name, category: menuItems.category })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  const categories = [...new Set(itemRows.map((r) => r.category))];
  const itemNames = itemRows.map((r) => r.name);
  if (categories.length === 0) return null;

  // ── Step 3: Find candidate restaurants in the same location ─────────────
  const allCandidateRestaurants = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      logoUrl: restaurants.logoUrl,
      openingHours: restaurants.openingHours,
    })
    .from(restaurants)
    .where(
      and(
        ne(restaurants.id, currentOrder.restaurantId),
        eq(restaurants.status, "active"),
        eq(restaurants.isActive, true),
        isNull(restaurants.deletionStatus),
        // Always filter by location using restaurant's own location (deliveryArea is often empty)
        ...(locationFilter
          ? [sql`LOWER(${restaurants.location}) = LOWER(${locationFilter})`]
          : [])
      )
    );

  // Only suggest restaurants that are currently open — otherwise addItem will fail server-side
  const candidateRestaurants = allCandidateRestaurants.filter((r) =>
    isRestaurantOpen(r.openingHours as Parameters<typeof isRestaurantOpen>[0])
  );

  if (candidateRestaurants.length === 0) return null;

  const candidateIds = candidateRestaurants.map((r) => r.id);

  // ── Step 4: Load analytics — avg acceptance time per candidate ─────────────
  const metricsRows = await db
    .select({
      restaurantId: orderMetrics.restaurantId,
      avgWaitMs: avg(orderMetrics.waitTimeMs).as("avg_wait_ms"),
    })
    .from(orderMetrics)
    .where(
      and(
        isNotNull(orderMetrics.waitTimeMs),
        isNotNull(orderMetrics.confirmedAt),
        inArray(orderMetrics.restaurantId, candidateIds)
      )
    )
    .groupBy(orderMetrics.restaurantId);

  const waitMsMap = new Map<string, number>();
  for (const row of metricsRows) {
    if (row.restaurantId && row.avgWaitMs !== null) {
      waitMsMap.set(row.restaurantId, Number(row.avgWaitMs));
    }
  }

  // ── Step 5: Load dishes for each candidate ────────────────────────────────
  // First try same-category dishes; if none found, fall back to any available dish.
  let allDishes = await db
    .select({
      id: menuItems.id,
      restaurantId: menuItems.restaurantId,
      name: menuItems.name,
      price: menuItems.price,
      category: menuItems.category,
      imageUrl: menuItems.imageUrl,
    })
    .from(menuItems)
    .where(
      and(
        inArray(menuItems.restaurantId, candidateIds),
        eq(menuItems.status, "available"),
        inArray(menuItems.category, categories)
      )
    );

  // Fallback: no category match → any available dish from those restaurants
  if (allDishes.length === 0) {
    allDishes = await db
      .select({
        id: menuItems.id,
        restaurantId: menuItems.restaurantId,
        name: menuItems.name,
        price: menuItems.price,
        category: menuItems.category,
        imageUrl: menuItems.imageUrl,
      })
      .from(menuItems)
      .where(
        and(
          inArray(menuItems.restaurantId, candidateIds),
          eq(menuItems.status, "available")
        )
      );
  }

  // Group dishes by restaurant
  const dishesByRestaurant = new Map<string, typeof allDishes>();
  for (const dish of allDishes) {
    const existing = dishesByRestaurant.get(dish.restaurantId) ?? [];
    existing.push(dish);
    dishesByRestaurant.set(dish.restaurantId, existing);
  }

  // Build candidates list — only restaurants that have at least one dish
  const candidates: CandidateForAI[] = candidateRestaurants
    .filter((r) => (dishesByRestaurant.get(r.id)?.length ?? 0) > 0)
    .map((r) => {
      const avgMs = waitMsMap.get(r.id) ?? 0;
      return {
        restaurantId: r.id,
        restaurantName: r.name,
        avgAcceptanceMinutes: avgMs > 0 ? Math.max(1, Math.round(avgMs / 60000)) : 0,
        hasHistoricalData: avgMs > 0,
        dishes: (dishesByRestaurant.get(r.id) ?? []).slice(0, 5).map((d) => ({
          id: d.id,
          name: d.name,
          price: Number(d.price),
          category: d.category,
        })),
      };
    })
    .sort((a, b) => {
      // Fast restaurants with data first, then unknowns
      if (a.hasHistoricalData && !b.hasHistoricalData) return -1;
      if (!a.hasHistoricalData && b.hasHistoricalData) return 1;
      return a.avgAcceptanceMinutes - b.avgAcceptanceMinutes;
    })
    .slice(0, 5); // Send top 5 to GPT at most

  if (candidates.length === 0) return null;

  // ── Step 6: Ask GPT-4o mini to pick the best one (or use analytics fallback) ─
  let chosenRestaurantId: string;
  let chosenDishId: string;
  let aiReason: string;

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const prompt = buildPrompt(
        itemNames,
        Number(currentOrder.totalAmount),
        currentOrder.deliveryArea ?? "",
        candidates
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 120,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as { restaurantId?: string; dishId?: string; reason?: string };

      chosenRestaurantId = parsed.restaurantId ?? candidates[0].restaurantId;
      chosenDishId = parsed.dishId ?? candidates[0].dishes[0].id;
      aiReason = parsed.reason ?? "This restaurant is highly rated and typically accepts orders quickly.";

      console.log("[ai-suggestion] GPT-4o mini picked:", { chosenRestaurantId, chosenDishId, aiReason });
    } catch (err) {
      // Fallback to top analytics pick if GPT call fails
      console.error("[ai-suggestion] GPT-4o mini call failed — falling back to top candidate:", err);
      chosenRestaurantId = candidates[0].restaurantId;
      chosenDishId = candidates[0].dishes[0].id;
      aiReason = "This restaurant typically accepts orders quickly and has similar dishes.";
    }
  } else {
    // No OpenAI key — use the top analytics-ranked candidate directly
    console.warn("[ai-suggestion] OPENAI_API_KEY not set — using analytics fallback.");
    chosenRestaurantId = candidates[0].restaurantId;
    chosenDishId = candidates[0].dishes[0].id;
    const topCandidate = candidates[0];
    aiReason = topCandidate.hasHistoricalData
      ? `${topCandidate.restaurantName} typically accepts orders in ~${topCandidate.avgAcceptanceMinutes} min — much faster than your current wait.`
      : `${topCandidate.restaurantName} is available now and may accept your order faster.`;
  }

  // ── Step 7: Resolve chosen restaurant + dish ──────────────────────────────
  const chosenRestaurant =
    candidateRestaurants.find((r) => r.id === chosenRestaurantId) ?? candidateRestaurants[0];

  const chosenDish =
    allDishes.find((d) => d.id === chosenDishId && d.restaurantId === chosenRestaurant.id) ??
    dishesByRestaurant.get(chosenRestaurant.id)?.[0];

  if (!chosenDish) return null;

  const avgMs = waitMsMap.get(chosenRestaurant.id) ?? 0;

  return {
    restaurantId: chosenRestaurant.id,
    restaurantName: chosenRestaurant.name,
    restaurantLogoUrl: chosenRestaurant.logoUrl,
    avgAcceptanceMinutes: avgMs > 0 ? Math.max(1, Math.round(avgMs / 60000)) : 0,
    aiReason,
    dish: {
      id: chosenDish.id,
      name: chosenDish.name,
      price: Number(chosenDish.price),
      imageUrl: chosenDish.imageUrl,
      category: chosenDish.category,
    },
  };
}
