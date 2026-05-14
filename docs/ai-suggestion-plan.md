# AI Order Suggestion — Technical Plan

> Feature: While customer waits for restaurant to accept, after 1 minute show an AI-proposed alternative order with high acceptance probability.

---

## How it works end-to-end

```
Customer places order
        ↓
Order lands in PENDING_CONFIRMATION
        ↓
Frontend starts a 60-second background timer (silent, no UI yet)
        ↓
At 60 seconds — if still PENDING_CONFIRMATION — call GET /api/orders/suggestion
        ↓
API analyses customer history + scores available restaurants
        ↓
Returns best proposed order
        ↓
Popup slides up: "Here's a faster option — high chance of quick acceptance"
        ↓
Customer can: Place this instead | Keep waiting
```

---

## Part 1 — Schema changes (1 addition)

### Add `confirmedAt` to `orders` table

**File:** `src/lib/db/schema/orders.ts`

```ts
confirmedAt: timestamp("confirmed_at"),  // nullable — set when owner accepts
```

**Why:** This is the only way to accurately measure how fast a restaurant accepts orders. We calculate `confirmedAt - createdAt` per restaurant to get their real acceptance speed. Currently we have no way to know this because `updatedAt` gets overwritten on every status change.

**Migration:** Add the column, backfill nulls for historical orders, populate going forward in the owner accept route.

---

### Where to populate `confirmedAt`

**File:** `src/app/api/owner/orders/[id]/status/route.ts`

When status transitions to `CONFIRMED`, write:
```ts
confirmedAt: new Date()
```

That's the only change to existing routes for data capture.

---

## Part 2 — The suggestion API

### New route: `GET /api/orders/suggestion`

**Query params:** `?pendingOrderId=<uuid>`

**Auth:** Required (uses current user's session)

### What it does step by step:

**Step 1 — Load the pending order**
- Fetch the order by `pendingOrderId`
- Confirm it belongs to the current user and is still `PENDING_CONFIRMATION`
- Extract: `deliveryArea`, `deliveryAddress`, `distanceMiles`, `totalAmount`

**Step 2 — Load customer's last 3 completed orders**
```sql
SELECT orders.*, orderItems.*, menuItems.category, menuItems.name
FROM orders
JOIN orderItems ON orderItems.orderId = orders.id
JOIN menuItems ON menuItems.id = orderItems.menuItemId
WHERE orders.userId = :userId
  AND orders.status IN ('DELIVERED', 'PAID')
ORDER BY orders.createdAt DESC
LIMIT 3
```

**Step 3 — Build customer preference profile**
From the 3 orders, derive:
- `preferredCategories`: count occurrences of each `menuItems.category`, rank them (e.g. `["Burgers": 5, "Sides": 3, "Drinks": 2]`)
- `avgSpend`: average `totalAmount` across the 3 orders
- `spendRange`: `[min - £2, max + £2]` tolerance band
- `deliveryArea`: from the pending order (already known)

**Step 4 — Find candidate restaurants**
```sql
SELECT r.id, r.name, r.logoUrl, r.openingHours, r.latitude, r.longitude,
       AVG(EXTRACT(EPOCH FROM (o.confirmedAt - o.createdAt)) * 1000) as avgAcceptanceMs,
       COUNT(o.id) as sampleSize
FROM restaurants r
LEFT JOIN orders o ON o.restaurantId = r.id
  AND o.confirmedAt IS NOT NULL
  AND o.createdAt > NOW() - INTERVAL '30 days'
WHERE r.status = 'active'
  AND r.isActive = true
  AND r.id != :currentRestaurantId  -- exclude the one they're already waiting on
GROUP BY r.id
```

Then filter in application code:
- Restaurant must be open right now (use existing `isRestaurantOpen()` utility)
- Restaurant must have at least 1 menu item in the customer's `preferredCategories`
- Restaurant must have `sampleSize >= 3` (enough data to trust the acceptance speed)

**Step 5 — Score each candidate restaurant**

Each restaurant gets a score out of 100:

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Category match | 40 pts | How many of their available items match customer's top categories. Full 40 if top category matches, scaled down for partial |
| Acceptance speed | 30 pts | `avgAcceptanceMs < 2min` = 30pts, `< 4min` = 20pts, `< 6min` = 10pts, `> 6min` = 0pts |
| Price proximity | 20 pts | Proposed order total within customer's `spendRange` = 20pts, within ±£5 = 10pts |
| Same delivery area | 10 pts | `deliveryArea` matches = 10pts, else 0 |

Pick the restaurant with the **highest score**.

**Step 6 — Build the proposed order**

From the winning restaurant, select items that:
- Are `status = 'available'`
- Match the customer's top 1-2 preferred categories
- Keep total within customer's `spendRange`

Select the minimum items needed to reach a natural order (e.g. a main + a side if that matches their history). Do not over-fill — mirror their typical order size.

**Step 7 — Return the proposal**

```ts
{
  restaurant: {
    id, name, logoUrl,
    avgAcceptanceMs,      // e.g. 95000 = ~1.5 minutes
    formattedAcceptance,  // "Usually accepts in ~2 min"
  },
  items: [
    { menuItemId, name, category, price, quantity }
  ],
  estimatedTotal: number,  // items + deliveryFee + serviceCharge
  deliveryFee: number,
  confidence: number,      // the score out of 100
  reason: string           // "Matches your usual order · Fast acceptance · Same area"
}
```

If no candidate scores above **50**, return `{ suggestion: null }` — don't show a low-confidence popup.

---

## Part 3 — Frontend changes

### 3a. Trigger logic in the status page

**File:** `src/app/dashboard/customer/status/[id]/page.tsx`

Add a `useEffect` that fires once after 60 seconds, only if order is still `PENDING_CONFIRMATION`:

```ts
useEffect(() => {
  if (order?.status !== "PENDING_CONFIRMATION") return;
  const timer = setTimeout(async () => {
    if (order?.status !== "PENDING_CONFIRMATION") return;
    const res = await fetch(`/api/orders/suggestion?pendingOrderId=${order.id}`, { headers: { Authorization: ... } });
    const data = await res.json();
    if (data.suggestion) setSuggestion(data.suggestion);
  }, 60_000); // 1 minute
  return () => clearTimeout(timer);
}, [order?.id, order?.status]);
```

State: `const [suggestion, setSuggestion] = useState(null)`

When `suggestion` is not null → render the popup component.

---

### 3b. New popup component

**New file:** `src/components/dashboard/customer/AiSuggestionPopup.tsx`

**Layout:**
- Slides up from bottom (Framer Motion `y: 100 → y: 0`)
- Shows after 1 minute, dismissable
- Dim background behind it (not full modal — partial overlay)

**Content:**
```
┌─────────────────────────────────┐
│  ⚡ Faster Option Available      │
│                                 │
│  [Logo] Burger Palace           │
│  Usually accepts in ~2 min      │
│                                 │
│  • Classic Burger     £8.50     │
│  • Fries              £3.00     │
│                                 │
│  Total: £13.50 (incl. delivery) │
│                                 │
│  Matches your usual order ·     │
│  Fast acceptance · Same area    │
│                                 │
│  [Place This Order]             │
│  [Keep Waiting]                 │
└─────────────────────────────────┘
```

**"Place This Order" button:**
- Calls `POST /api/orders` with the suggested items pre-filled
- Cancels the original pending order simultaneously (2 API calls in parallel)
- Redirects to the new order's status page

**Props:**
```ts
interface AiSuggestionPopupProps {
  suggestion: SuggestionResponse;
  currentOrderId: string;
  deliveryArea: string;
  deliveryAddress: string;
  customerPhone: string;
  onDismiss: () => void;
}
```

---

## Part 4 — Migration

### New Drizzle migration

Create file: `supabase/migrations/XXXXXX_add_confirmed_at_to_orders.sql`

```sql
ALTER TABLE orders ADD COLUMN confirmed_at TIMESTAMP;
CREATE INDEX orders_confirmed_at_idx ON orders(confirmed_at) WHERE confirmed_at IS NOT NULL;
```

No backfill needed — historical orders will have `null` which is correct (we don't know when they were accepted historically). The acceptance speed scoring only uses data from the last 30 days, so the stats will build up naturally.

---

## Part 5 — What you need to verify before building

1. **`menuItems.category`** — this column already exists and is `NOT NULL`. But are categories being used consistently across restaurants? If every restaurant uses different category names (e.g. "Burgers" vs "burger" vs "Burger Meals"), the matching will be poor. You may want to normalise category values to lowercase or define a fixed enum.

2. **Restaurant lat/lng** — `restaurants.latitude` and `restaurants.longitude` exist. But are they populated for all restaurants? The area-match fallback (`deliveryArea` text match) handles the case where lat/lng is null.

3. **Order history volume** — the scoring requires `sampleSize >= 3` recent accepted orders per restaurant. New restaurants with few orders won't appear in suggestions. That's intentional — we only suggest restaurants we have confidence data on.

4. **Cart pre-fill** — when customer clicks "Place This Order", the suggestion includes `menuItemId + quantity`. The checkout POST already accepts items from the cart. You'll need to decide: do you write the suggestion items into the customer's cart first and then redirect to checkout? Or do you bypass the cart and POST directly? Bypassing cart is simpler and avoids polluting their real cart.

---

## Build order (what to do first)

1. Add `confirmedAt` column to schema + migration
2. Populate `confirmedAt` in the owner accept route
3. Build `GET /api/orders/suggestion` route
4. Build `AiSuggestionPopup.tsx` component (static/mock data first)
5. Wire up the 60-second trigger in status page
6. Connect popup to real API
7. Wire "Place This Order" button

---

## What this does NOT need

- No new AI/ML model — pure rule-based scoring using existing data
- No separate background job or queue — the API is called on-demand from the frontend after 1 minute
- No new user preference table — preferences are derived at query time from order history
- No changes to the cart schema
