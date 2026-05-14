# Bug Report — Food Delivery UI

> Last updated: 2026-05-14  
> Audited by: Claude Code  
> Status legend: 🔴 Critical · 🟠 High · 🟡 Medium

---

## 🔴 Critical

---

### BUG-001 — Backend order expiry is 5 min, UI timer is 10 min

**File:** `src/lib/order-expiration.ts:7`  
**Status:** 🔴 Critical — affects every order  

**Problem:**  
The backend auto-cancels `PENDING_CONFIRMATION` orders after 5 minutes (`EXPIRY_MS = 5 * 60 * 1000`). The UI timer was recently updated to 10 minutes. This means the customer sees "7:30 remaining" on screen but their order has already been cancelled on the server.

**Impact:** Every order placed looks alive to the customer but is dead on the server from minute 5 onward. Accepting at minute 6 from the owner side will fail silently or throw an error.

**Fix:** Change `order-expiration.ts` to match the UI: `EXPIRY_MS = 10 * 60 * 1000`.

---

### BUG-002 — Stripe webhook ignores multi-restaurant session payments

**File:** `src/app/api/webhooks/stripe/route.ts`  
**Status:** 🔴 Critical — multi-restaurant orders never auto-confirm payment  

**Problem:**  
The webhook handler only reads `session.metadata?.orderId`. Session-level Stripe checkouts (multi-restaurant) store `orderSessionId` in metadata, not `orderId`. So when Stripe fires `checkout.session.completed` for a session payment, the webhook finds no matching order and does nothing. The order stays `CONFIRMED` indefinitely.

**Impact:** Multi-restaurant orders rely entirely on the client-side `/stripe/verify` fallback. If the user closes the browser after paying, the order is never marked `PAID`. Restaurant never gets the paid notification.

**Fix:** In the webhook handler, check both `metadata.orderId` and `metadata.orderSessionId` and route accordingly.

---

### BUG-003 — Missing serviceCharge in reorder total

**File:** `src/app/api/orders/[id]/reorder/route.ts:48-66`  
**Status:** 🔴 Critical — customers undercharged on reorders  

**Problem:**  
```ts
const total = subtotal + parseFloat(originalOrder.deliveryFee || "0");
// serviceCharge is never included
```
The reorder route copies `deliveryFee` from the original order but drops `serviceCharge` entirely. The new order's `totalAmount` is incorrect.

**Impact:** Customers are undercharged on every reorder. Stripe receives the wrong amount. Causes accounting discrepancies.

**Fix:**
```ts
const total = subtotal
  + parseFloat(originalOrder.deliveryFee || "0")
  + parseFloat(originalOrder.serviceCharge || "0");
```

---

### BUG-004 — No idempotency for session-level Stripe webhook retries

**File:** `src/app/api/webhooks/stripe/route.ts`  
**Status:** 🔴 Critical — duplicate processing on Stripe retries  

**Problem:**  
The webhook has an idempotency guard for single orders (`if (!updatedOrder) return`), but there is no equivalent guard for session-level payments. If Stripe retries the event (which it does automatically on non-2xx responses), the session payment can be processed multiple times.

**Impact:** Duplicate `PAID` status transitions, duplicate notifications to owner and customer, potential duplicate Shipday dispatch requests.

**Fix:** Before processing a session payment, check if the session is already in `PAID` status and return early if so.

---

## 🟠 High

---

### BUG-005 — Payment verify fails if auth token expires during Stripe redirect

**File:** `src/app/api/orders/[id]/stripe/verify/route.ts:46-47`  
**Status:** 🟠 High — payment goes through but order stays stuck  

**Problem:**  
The verify endpoint calls `getCurrentUser()` which requires a valid Supabase session cookie. If the user's session expires during the Stripe checkout redirect (user takes too long on Stripe's page), the verify call returns 401. The order remains `CONFIRMED` permanently even though Stripe charged the customer.

**Impact:** Customer is charged but sees no confirmation. Order is never `PAID`. Restaurant never starts preparing.

**Fix:** The verify route should not require authentication — it already validates via `stripeSessionId` from the query param which is a secret Stripe token. Remove the auth requirement or make it optional for this route only.

---

### BUG-006 — No push notification when session reaches READY_TO_PAY

**File:** `src/lib/order-session.ts`  
**Status:** 🟠 High — customer has no prompt to pay  

**Problem:**  
When all restaurants in a multi-restaurant session confirm and the session transitions to `READY_TO_PAY`, no FCM or WhatsApp notification is sent to the customer. The customer only finds out by manually refreshing the orders page.

**Impact:** Orders sit in `READY_TO_PAY` and customers miss the window to pay. For time-sensitive orders this directly causes cancellations.

**Fix:** After `syncSessionStatus` sets session to `READY_TO_PAY`, send a push notification to the customer: "All restaurants confirmed — tap to pay."

---

### BUG-007 — Delivery fee double-counting in partial session confirmations

**File:** `src/app/api/orders/route.ts` (delivery fee breakdown logic)  
**Status:** 🟠 High — incorrect totals when one restaurant cancels  

**Problem:**  
If the frontend's `deliveryFeesBreakdown` doesn't include all restaurants, the fallback divides the total delivery fee by restaurant count:
```ts
const restaurantFee = fees[restaurantId] || (deliveryFee / Object.keys(itemsByRestaurant).length);
```
When one restaurant cancels, `syncSessionStatus` recalculates the session total from the remaining orders. But each remaining order already has the full proportional fee baked in, so the total is now wrong relative to what was originally agreed.

**Impact:** Customers can be overcharged or undercharged after partial cancellations in multi-restaurant sessions.

**Fix:** Store the intended delivery fee per restaurant at order creation time and use that as the source of truth during session recalculation.

---

## 🟡 Medium

---

### BUG-008 — Customer can cancel PENDING_CONFIRMATION orders despite state machine restriction

**File:** `src/app/api/orders/[id]/status/route.ts:71-99`  
**Status:** 🟡 Medium — unintended state transition  

**Problem:**  
The `ORDER_ALLOWED_TRANSITIONS` state machine does not include `PENDING_CONFIRMATION → CANCELLED` as a valid customer transition. However, the cancellation logic has a separate hardcoded `cancellableStatuses` array that includes `PENDING_CONFIRMATION`, allowing the transition anyway.

**Impact:** Inconsistency between the declared state machine and actual behaviour. Could allow premature cancellations before the owner even sees the order.

**Fix:** Align the cancellation check with the state machine, or explicitly add `PENDING_CONFIRMATION → CANCELLED` to `ORDER_ALLOWED_TRANSITIONS` as an intentional transition.

---

### BUG-009 — No way to cancel a session once it reaches READY_TO_PAY

**File:** `src/lib/order-session.ts`  
**Status:** 🟡 Medium — customer stuck if they don't want to pay  

**Problem:**  
Once a session reaches `READY_TO_PAY` (because at least one restaurant confirmed), there is no API route or UI path for the customer to cancel the entire session. They can cancel individual sub-orders via the single-order endpoint, which will trigger `syncSessionStatus`, but the session itself has no cancel endpoint.

**Impact:** If a customer changes their mind after restaurants confirm, they have to manually cancel each sub-order. If even one sub-order cancellation fails, the session stays open.

**Fix:** Add a `DELETE /api/orders/session/[id]` or `PATCH` endpoint to cancel an entire session, cascading the cancellation to all non-PAID sub-orders.

---

### BUG-010 — Orphaned orderSession records after single-restaurant order cancellation

**File:** `src/app/api/orders/route.ts` (order creation)  
**Status:** 🟡 Medium — database bloat  

**Problem:**  
Every order — including single-restaurant orders — gets an `orderSession` record created. When a single-restaurant order is cancelled, the order is marked `CANCELLED` but the associated `orderSession` record is never cleaned up. It stays in `PENDING` or `READY_TO_PAY` indefinitely.

**Impact:** Database accumulates orphaned session records over time. Any admin query showing "active sessions" will include ghost sessions.

**Fix:** When an order transitions to `CANCELLED` and it has a `sessionId`, check if all sibling orders are also cancelled and if so, mark the session `CANCELLED` as well.

---

## Notes

- BUG-001 is the most urgent fix right now — the backend/frontend timer mismatch affects 100% of orders since the 10-minute UI change.
- BUG-002 and BUG-004 together mean multi-restaurant payments are unreliable end-to-end.
- BUG-003 is silent data corruption — no errors thrown, just wrong numbers.
