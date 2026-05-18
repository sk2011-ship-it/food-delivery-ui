# Order Flow — Complete Reference

This document covers every step of an order from the moment a customer adds an item to cart until it is delivered. All statuses, conditions, triggers, and failure cases are documented here.

---

## Status Overview

### Order Statuses
```
PENDING_CONFIRMATION  ← 10 min window: owner must accept OR customer can cancel
       ↓ (owner accepts — sets confirmedAt)
   CONFIRMED          ← 5 min window: customer must pay (auto-cancel via cron if not)
       ↓ (customer pays via Stripe — sets paidAt)
     PAID             ← 2 min grace: customer can still cancel
       ↓ (after 2 min grace — owner clicks "Start Kitchen")
   PREPARING
       ↓ (owner clicks Dispatch)
  OUT_FOR_DELIVERY
       ↓ (owner marks delivered OR Shipday webhook)
   DELIVERED

Any status → CANCELLED
```

### Order Session Statuses (multi-restaurant orders)
```
PENDING → READY_TO_PAY → PAID
        ↘ (all restaurants reject) → CANCELLED
```

### Delivery Job Statuses
```
DISPATCH_REQUESTED → OUT_FOR_DELIVERY → DELIVERED
                  ↘ CANCELLED
```

---

## Step 1: Customer Adds Items to Cart

**Route:** `POST /api/cart`

**Conditions checked:**
- Customer must be logged in
- Menu item must exist and have status = `"available"`
- Restaurant must be currently open (checks `openingHours` schedule)

**What happens:**
- If item already in cart → quantity incremented atomically
- If new item → inserted into `cartItems` table
- Cart is stored **in the database** (not localStorage)

**Failure cases:**
- Restaurant is closed → 400 error, item not added
- Menu item not available → error

---

## Step 2: Customer Goes to Checkout

**Route:** `POST /api/orders`

**Conditions checked (all must pass):**
1. Platform must be **open** (admin toggle in Settings → Platform Status)
2. Delivery address, area, and phone number must be provided (min 10 digits)
3. At least one restaurant in cart must be open
4. Delivery fee is re-validated server-side (not trusted from client)

**What happens (inside a DB transaction):**
1. Creates a parent `orderSession` (status: `PENDING`)
2. Groups cart items by restaurant
3. For each restaurant group:
   - Creates one `order` with status `PENDING_CONFIRMATION`
   - Creates `orderItems` for each cart line
   - Applies service charge from site config
4. Updates session with totals
5. Clears the customer's entire cart
6. **Background (fire-and-forget):**
   - Sends FCM + WhatsApp notification to restaurant owner
   - Sends FCM + WhatsApp notification to customer (2s delay to ensure DB visibility)

**Failure cases:**
- Platform offline → 503, order not created, customer sees maintenance message
- Restaurant closed → error
- Invalid address/phone → validation error

> **Multi-restaurant:** If cart has items from multiple restaurants, one `orderSession` is created with one separate `order` per restaurant. Each restaurant independently accepts or rejects their order.

---

## Step 3: Owner Accepts or Rejects

**Route:** `PATCH /api/owner/orders/[id]/status`

**Who:** Restaurant owner (verified — must own the restaurant on the order)

**Allowed transitions from owner:**
| From | To | Note |
|------|----|------|
| `PENDING_CONFIRMATION` | `CONFIRMED` | Accepted |
| `PENDING_CONFIRMATION` | `CANCELLED` | Rejected |
| `CONFIRMED` | `CANCELLED` | Cancel before payment |
| `PAID` | `PREPARING` | *(handled automatically — see Step 4)* |
| `PAID` | `CANCELLED` | |
| `PREPARING` | `OUT_FOR_DELIVERY` | Dispatch order |
| `DISPATCH_REQUESTED` | `OUT_FOR_DELIVERY` | Manual dispatch |
| `OUT_FOR_DELIVERY` | `DELIVERED` | Mark delivered |
| `OUT_FOR_DELIVERY` | `CANCELLED` | |

**Auto-expiry (10-minute rule):**
- If owner does **not** accept within 10 minutes, the order is automatically `CANCELLED`
- Triggered by: `/api/cron/cancel-expired-orders` (server cron) OR when the owner dashboard loads
- Notifications sent to both owner and customer on expiry

**Side effects on accept (`CONFIRMED`):**
- Triggers `syncSessionStatus()` — if this is a multi-restaurant session and all restaurants have responded, session moves to `READY_TO_PAY`
- Customer receives FCM notification

**Side effects on reject (`CANCELLED`):**
- Triggers `syncSessionStatus()` — if all restaurants in session have rejected, session becomes `CANCELLED`
- Customer receives FCM notification

---

## Step 4: Customer Pays

**Route:** `POST /api/orders/[id]/stripe/session` — creates Stripe checkout URL

**Multi-restaurant:** `POST /api/orders/session/[id]/stripe/session` — one combined payment for all confirmed orders in session

**Conditions:**
- Order must be `CONFIRMED` (or session must be `READY_TO_PAY`)
- Only confirmed orders in a session are included in the payment total

**Stripe Checkout line items include:**
- Each menu item (name, qty, price)
- Delivery fee (if applicable for the area)
- Service charge

**What happens after customer completes payment:**

### Primary path — Stripe Webhook
**Route:** `POST /api/webhooks/stripe` (event: `checkout.session.completed`)

1. Reads `orderId` or `orderSessionId` from Stripe metadata
2. Atomically updates order to `PAID` (only if currently `PENDING_CONFIRMATION` or `CONFIRMED` — idempotency guard)
3. **Background tasks:**
   - Notifies restaurant owner (FCM + WhatsApp)
   - Notifies customer (FCM + WhatsApp + Email)
   - Triggers **Shipday delivery job** (see Step 5)

### Fallback path — Verify endpoint
If the webhook is missed (network issue), the checkout page calls:
**Route:** `POST /api/orders/[id]/stripe/verify`

- Fetches the Stripe session directly
- Verifies `payment_status = "paid"`
- Same updates as webhook path

**After PAID:** The owner dashboard **automatically advances** the order to `PREPARING` — no manual click required.

---

## Step 5: Delivery Job Created (Shipday)

Triggered automatically after payment, as part of the webhook/verify flow.

**Service:** `ShipdayService.triggerShipdayOrder(orderId)`

**Atomic lock pattern:** Inserts a `"LOCK"` placeholder in `deliveryJobs` to prevent race conditions if webhook fires twice.

**What gets sent to Shipday:**
- Customer name, phone, delivery address + coordinates
- Restaurant name, phone, pickup address
- Order items and totals
- Estimated delivery time

**Initial delivery job status:** `DISPATCH_REQUESTED`

**Stored back:**
- `providerOrderId` (Shipday's ID)
- `trackingUrl` (customer-facing link)
- `driverName`, `eta`, `driverPhone`

---

## Step 6: Kitchen Prepares Order

**Status:** `PREPARING`

**How reached:** Automatically — when order becomes `PAID`, the owner dashboard immediately calls the status API to advance it to `PREPARING`. No manual click needed.

**Owner sees:** The order card with a **"Dispatch Order"** button.

---

## Step 7: Order Dispatched

**Owner action:** Clicks "Dispatch Order" in the dashboard.

**Route:** `PATCH /api/owner/orders/[id]/status` with `status: "OUT_FOR_DELIVERY"`

**What happens:**
- Order status → `OUT_FOR_DELIVERY`
- Delivery job status → `OUT_FOR_DELIVERY`
- Syncs with Shipday (marks as dispatched)
- Notifies customer (FCM + WhatsApp)
- Owner sees: Tracking URL button in the order card

> **Important:** The Shipday webhook **cannot** set an order to `OUT_FOR_DELIVERY`. Only the owner can do this by clicking the button. This is intentional — the owner must confirm the handoff.

---

## Step 8: Delivered

**Triggered by:** Shipday webhook OR owner manually marking delivered.

**Route (webhook):** `POST /api/webhooks/shipday`

Shipday webhook status mapping:
| Shipday Status | Order Status |
|----------------|-------------|
| `DELIVERED`, `COMPLETED`, `COMPLETE` | `DELIVERED` |
| `OUT_FOR_DELIVERY`, `ON_THE_WAY`, `PICKED_UP`, `STARTED` | *(only updates delivery job, not order — owner must dispatch)* |
| `FAILED`, `INCOMPLETE`, `CANCELLED` | `CANCELLED` |
| `PRE_ASSIGNED`, `ASSIGNED`, `PENDING` | `DISPATCH_REQUESTED` |

**On delivered:**
- Order → `DELIVERED` (terminal state)
- Notifies owner and customer
- Order moves to history

---

## Cancellation Rules

| Who | Can cancel when | Cannot cancel when |
|-----|-----------------|--------------------|
| Customer | `PENDING_CONFIRMATION`, `CONFIRMED` | `PAID` or later |
| Owner | `PENDING_CONFIRMATION`, `CONFIRMED`, `PAID`, `PREPARING`, `OUT_FOR_DELIVERY` | `DELIVERED` |
| Auto (10-min timer) | `PENDING_CONFIRMATION` (not accepted in time) | Any other status |
| Shipday webhook | `DISPATCH_REQUESTED`, `PREPARING`, `PAID`, `CONFIRMED`, `PENDING_CONFIRMATION` | `OUT_FOR_DELIVERY`, `DELIVERED` |

---

## Notification Summary

| Step | Event | Owner WhatsApp Template | Customer WhatsApp Template |
|------|-------|------------------------|---------------------------|
| 1 | Order placed | `kilkeel_owner_new_order` (Quick Reply: Accept/Decline) | `kilkeel_customer_order_received` |
| 2a | Owner accepts | — | `kilkeel_customer_pay_now` (CTA: Pay Now button + amount) |
| 2b | Owner declines | — | `kilkeel_customer_order_declined` |
| 3 | Payment confirmed | `kilkeel_owner_payment_received` (Quick Reply: Start Kitchen) | `kilkeel_customer_payment_confirmed` |
| 4 | Kitchen started (PREPARING) | — | `kilkeel_customer_preparing` |
| 5 | Out for delivery | — | `kilkeel_customer_out_for_delivery` |
| 6 | Delivered | — | `kilkeel_customer_delivered` |
| Any | Cancellation | `kilkeel_owner_cancelled` | `kilkeel_customer_cancelled` |

All channels: **FCM + WhatsApp**  
Full template JSON specs: see `docs/whatsapp-templates.md`

---

## Key Conditions & Guards

| Guard | Where enforced |
|-------|---------------|
| Platform must be open | `POST /api/orders` — 503 if offline |
| Restaurant must be open | Cart add + order creation |
| Delivery fee validated server-side | Order creation |
| Payment idempotency | Stripe webhook checks status before updating |
| Shipday race condition lock | `"LOCK"` placeholder in deliveryJobs |
| Owner can't set PAID (payment only) | Owner PATCH route rejects PAID as a target |
| Webhook can't dispatch (OUT_FOR_DELIVERY) | Shipday webhook hard-blocked from this transition |
| Session PAID protection | `syncSessionStatus()` never downgrades a PAID session |
| 10-minute accept window | Cron + client-side timer |

---

## API Route Reference

### Cart
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cart` | Fetch cart |
| POST | `/api/cart` | Add item |
| PATCH | `/api/cart/[itemId]` | Update quantity |
| DELETE | `/api/cart/[itemId]` | Remove item |
| POST | `/api/cart/clear` | Clear cart |

### Customer Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/orders` | Create order from cart |
| GET | `/api/orders` | List orders (active/past) |
| GET | `/api/orders/[id]` | Single order |
| PATCH | `/api/orders/[id]/status` | Customer cancel only |
| POST | `/api/orders/[id]/reorder` | Reorder |
| POST | `/api/orders/[id]/stripe/session` | Create Stripe checkout |
| POST | `/api/orders/[id]/stripe/verify` | Verify payment (fallback) |
| POST | `/api/orders/session/[id]/stripe/session` | Multi-restaurant checkout |
| POST | `/api/orders/session/[id]/stripe/verify` | Multi-restaurant verify |

### Owner Orders
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/owner/orders` | List restaurant orders |
| PATCH | `/api/owner/orders/[id]/status` | Update order status |

### Webhooks
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/webhooks/stripe` | Stripe payment events |
| POST | `/api/webhooks/shipday` | Delivery status updates |

### Cron
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cron/cancel-expired-orders` | Auto-cancel 10-min expired orders |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/platform-status` | Get platform open/closed |
| POST | `/api/admin/platform-status` | Toggle platform |
| GET | `/api/platform-status` | Public check (no auth, used by checkout) |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/db/schema/orders.ts` | Order table + status enum |
| `src/lib/db/schema/orderSessions.ts` | Multi-restaurant session table |
| `src/lib/db/schema/deliveryJobs.ts` | Delivery job table |
| `src/lib/db/schema/cart.ts` | Cart items table |
| `src/app/api/orders/route.ts` | Order creation |
| `src/app/api/owner/orders/[id]/status/route.ts` | Owner status transitions |
| `src/app/api/webhooks/stripe/route.ts` | Payment webhook |
| `src/app/api/webhooks/shipday/route.ts` | Delivery webhook |
| `src/services/shipday.service.ts` | Shipday API integration |
| `src/lib/order-session.ts` | Session status aggregation |
| `src/lib/order-expiration.ts` | 10-min expiry logic |
| `src/services/notification.service.ts` | FCM + WhatsApp + Email |
| `src/components/dashboard/owner/LiveOrdersView.tsx` | Owner kitchen dashboard |
| `src/components/dashboard/customer/CheckoutView.tsx` | Customer checkout |
