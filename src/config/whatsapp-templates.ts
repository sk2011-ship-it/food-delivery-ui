/**
 * whatsapp-templates.ts
 *
 * Single source of truth for all WhatsApp notification templates.
 * - SIDs map to approved Twilio Content templates (submitted for Meta approval)
 * - Body / variables shown here are what we pass at runtime
 * - To recreate/update templates in Twilio, run: node scripts/manage-whatsapp-templates.mjs
 */

export type WhatsAppTemplateName =
  | "kilkeel_owner_new_order"
  | "kilkeel_customer_order_received"
  | "kilkeel_customer_pay_now"
  | "kilkeel_customer_order_declined"
  | "kilkeel_owner_payment_received"
  | "kilkeel_customer_payment_confirmed"
  | "kilkeel_customer_preparing"
  | "kilkeel_customer_out_for_delivery"
  | "kilkeel_customer_delivered"
  | "kilkeel_customer_cancelled"
  | "kilkeel_owner_cancelled";

/**
 * Approved Twilio Content SIDs.
 * Update these if templates are recreated in Twilio.
 */
export const TEMPLATE_SIDS: Record<WhatsAppTemplateName, string> = {
  kilkeel_owner_new_order:           "HX687a3fc2a9e2acb96cc80dde70865844",
  kilkeel_customer_order_received:   "HXd66eb7a9eb5c5feb9d6d446de231b9ca",
  kilkeel_customer_pay_now:          "HXd2eb0e611616d32c42b96a9db5f74cba",
  kilkeel_customer_order_declined:   "HX7182366f5f2a0f96b1b70f2ddb6914e1",
  kilkeel_owner_payment_received:    "HX1ac5bda8a97526dff1f4f6b7b974e2fc",
  kilkeel_customer_payment_confirmed:"HX7122ef704a3bab9b78f63d96f436dc05",
  kilkeel_customer_preparing:        "HXcbe6d6496c3f274c918a35cf75122947",
  kilkeel_customer_out_for_delivery: "HXd4473fc4eeaeb695845406305f4cb254",
  kilkeel_customer_delivered:        "HXfa41355056597f85eef4c819c0c42a30",
  kilkeel_customer_cancelled:        "HX1c12f706d4270a7f1fbe1eae57630217",
  kilkeel_owner_cancelled:           "HX201c58ff0480fdc471d202959fcfa1f9",
};

/**
 * Full template definitions — body text + variable schema.
 * Used by the management script to create/recreate templates in Twilio.
 */
export const TEMPLATE_DEFINITIONS = [

  // ── 1. Owner: New Order ─────────────────────────────────────────────────────
  // Trigger : Customer places an order
  // Type    : Quick Reply (Accept / Decline buttons)
  // Who     : Restaurant Owner
  {
    name: "kilkeel_owner_new_order" as WhatsAppTemplateName,
    twilioType: "twilio/quick-reply",
    trigger: "Order placed → owner",
    variables: {
      "1": "orderId (8-char display, e.g. A1B2C3D4)",
      "2": "customerName",
      "3": "deliveryAddress + ', ' + deliveryArea",
      "4": "items list (each line: 'Name xQty — £price')",
      "5": "subtotal (totalAmount - deliveryFee - serviceCharge)",
      "6": "deliveryFee",
      "7": "serviceCharge",
      "8": "totalAmount",
      "9": "restaurant location (e.g. Kilkeel / Newcastle / Downpatrick)",
    },
    body: `🛎️ New Order #{{1}} — {{9}}

👤 Customer: {{2}}
🏠 Deliver to: {{3}}

📋 Items:
{{4}}

💷 Subtotal:  £{{5}}
🚗 Delivery:  £{{6}}
⚡ Service:   £{{7}}
──────────────────
💰 TOTAL:     £{{8}}

Please accept or decline this order ⬇️

— Your Local Eats`,
    buttons: [
      { title: "✅ Accept Order",  id: "accept"  },
      { title: "❌ Decline Order", id: "decline" },
    ],
  },

  // ── 2. Customer: Order Received ─────────────────────────────────────────────
  // Trigger : Customer places an order
  // Type    : Text
  // Who     : Customer
  {
    name: "kilkeel_customer_order_received" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Order placed → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "restaurant location (e.g. Kilkeel)",
    },
    body: `Hi {{1}}! 🛍️ We've received your order.

Order ID:   #{{2}}
Restaurant: {{3}}
Location:   {{4}}

The restaurant is reviewing your order now. We'll notify you as soon as it's accepted!

— Your Local Eats`,
  },

  // ── 3. Customer: Pay Now ────────────────────────────────────────────────────
  // Trigger : Owner accepts order (status → CONFIRMED)
  // Type    : Call-to-Action (URL button — Pay Now)
  // Who     : Customer
  {
    name: "kilkeel_customer_pay_now" as WhatsAppTemplateName,
    twilioType: "twilio/call-to-action",
    trigger: "Owner accepts → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "restaurant location",
      "5": "totalAmount",
      "6": "orderId (full UUID — used in Pay Now URL)",
    },
    body: `✅ Order Accepted, {{1}}!

Order ID:   #{{2}}
Restaurant: {{3}}
Location:   {{4}}

💰 Amount to Pay: £{{5}}

⏳ You have 5 minutes to complete payment.
After that, your order will be automatically cancelled.

Tap below to pay now 👇

— Your Local Eats`,
    button: { type: "URL", title: "💳 Pay Now", url: "https://kilkeeleats.com/orders/{{6}}" },
  },

  // ── 4. Customer: Order Declined ─────────────────────────────────────────────
  // Trigger : Owner declines order (status → CANCELLED, reason = "Declined by restaurant")
  // Type    : Text
  // Who     : Customer
  {
    name: "kilkeel_customer_order_declined" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Owner declines → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "restaurant location",
    },
    body: `Hi {{1}}, your order #{{2}} from {{3}} ({{4}}) has been declined by the restaurant.

You have not been charged. Please try ordering again or choose a different restaurant.

Sorry for the inconvenience! 🙏

— Your Local Eats`,
  },

  // ── 5. Owner: Payment Received ──────────────────────────────────────────────
  // Trigger : Customer pays (status → PAID)
  // Type    : Quick Reply (Start Kitchen button)
  // Who     : Restaurant Owner
  // Note    : 2-minute grace period before kitchen should start
  {
    name: "kilkeel_owner_payment_received" as WhatsAppTemplateName,
    twilioType: "twilio/quick-reply",
    trigger: "Payment confirmed → owner",
    variables: {
      "1": "orderId (8-char display)",
      "2": "customerName",
      "3": "deliveryAddress",
      "4": "items list (each line: 'Name xQty — £price')",
      "5": "totalAmount",
    },
    body: `💳 Payment Received! — Order #{{1}}

👤 Customer: {{2}}
🏠 Deliver to: {{3}}

📋 Items:
{{4}}

💰 TOTAL: £{{5}}

⏳ Please wait 2 minutes — the customer has a short cancellation window.

After 2 minutes, tap below to start preparing 👇

— Your Local Eats`,
    buttons: [
      { title: "👨‍🍳 Start Kitchen", id: "start_kitchen" },
    ],
  },

  // ── 6. Customer: Payment Confirmed ──────────────────────────────────────────
  // Trigger : Customer pays (status → PAID)
  // Type    : Text
  // Who     : Customer
  {
    name: "kilkeel_customer_payment_confirmed" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Payment confirmed → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "totalAmount",
    },
    body: `🎉 Payment Confirmed, {{1}}!

Order ID:    #{{2}}
Restaurant:  {{3}}
Amount Paid: £{{4}}

You have 2 minutes to cancel if needed.
After that, the kitchen will start preparing your food.

We'll notify you when it's being prepared! 🍽️

— Your Local Eats`,
  },

  // ── 7. Customer: Food Being Prepared ────────────────────────────────────────
  // Trigger : Owner moves order to PREPARING
  // Type    : Text
  // Who     : Customer
  {
    name: "kilkeel_customer_preparing" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Owner starts kitchen (PREPARING) → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "restaurant location",
    },
    body: `👨‍🍳 Your food is being prepared!

Hi {{1}}, Order #{{2}} from {{3}} ({{4}}) is now in the kitchen.

We'll let you know when it's on its way to you! 🛵

— Your Local Eats`,
  },

  // ── 8. Customer: Out for Delivery ───────────────────────────────────────────
  // Trigger : Owner dispatches order (status → OUT_FOR_DELIVERY)
  // Type    : Text
  // Who     : Customer
  {
    name: "kilkeel_customer_out_for_delivery" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Owner dispatches (OUT_FOR_DELIVERY) → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "restaurant location",
      "5": "deliveryAddress",
    },
    body: `🛵 Your order is on its way, {{1}}!

Order #{{2}} from {{3}} ({{4}}) has been picked up and is heading to you now.

📍 Delivering to: {{5}}

Get ready — it should be with you very soon! 🎉

— Your Local Eats`,
  },

  // ── 9. Customer: Delivered ──────────────────────────────────────────────────
  // Trigger : Order marked DELIVERED (Shipday webhook or owner)
  // Type    : Text
  // Who     : Customer
  {
    name: "kilkeel_customer_delivered" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Order delivered → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
    },
    body: `✅ Your order has arrived!

Hi {{1}}, Order #{{2}} from {{3}} has been delivered. Enjoy your meal! 🍽️

Thank you for ordering with Your Local Eats. We hope to see you again soon!

— Your Local Eats`,
  },

  // ── 10. Customer: Order Cancelled ───────────────────────────────────────────
  // Trigger : Any cancellation (auto-timeout / owner / customer)
  // Type    : Text
  // Who     : Customer
  // Cancellation reasons:
  //   "Restaurant did not respond in time"  — 10-min auto timeout
  //   "Payment was not completed in time"   — 5-min payment timeout
  //   "Declined by the restaurant"          — owner declined
  //   "Cancelled by you"                    — customer cancelled
  //   "Cancelled by the restaurant"         — owner cancelled post-payment
  {
    name: "kilkeel_customer_cancelled" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Any cancellation → customer",
    variables: {
      "1": "customerName",
      "2": "orderId (8-char display)",
      "3": "restaurantName",
      "4": "restaurant location",
      "5": "cancellationReason",
    },
    body: `❌ Order Cancelled

Hi {{1}}, your order #{{2}} from {{3}} ({{4}}) has been cancelled.

Reason: {{5}}

If you were charged, a full refund will be processed within 3–5 business days.

Sorry for the inconvenience! 🙏

— Your Local Eats`,
  },

  // ── 11. Owner: Order Cancelled ──────────────────────────────────────────────
  // Trigger : Any cancellation
  // Type    : Text
  // Who     : Restaurant Owner
  {
    name: "kilkeel_owner_cancelled" as WhatsAppTemplateName,
    twilioType: "twilio/text",
    trigger: "Any cancellation → owner",
    variables: {
      "1": "orderId (8-char display)",
      "2": "cancellationReason",
    },
    body: `❌ Order Cancelled — #{{1}}

Reason: {{2}}

No further action needed.

— Your Local Eats`,
  },

] as const;
