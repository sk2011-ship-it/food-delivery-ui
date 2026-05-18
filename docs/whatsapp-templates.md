# WhatsApp Templates — Complete Spec

All templates to create in Twilio Content Template Builder.  
Language: **English (UK)** for all.  
After creating each one, submit for WhatsApp Business approval.

---

## Naming Convention

```
kilkeel_[recipient]_[event]
```

---

## Template Map (by order flow step)

| Step | Event | Recipient | Template Name | Type |
|------|-------|-----------|--------------|------|
| 1 | Order placed | Owner | `kilkeel_owner_new_order` | Quick Reply (Accept / Decline) |
| 1 | Order placed | Customer | `kilkeel_customer_order_received` | Text |
| 2 | Owner accepts | Customer | `kilkeel_customer_pay_now` | Call-to-Action (Pay Now URL) |
| 2 | Owner declines | Customer | `kilkeel_customer_order_declined` | Text |
| 3 | Payment done | Owner | `kilkeel_owner_payment_received` | Quick Reply (Start Kitchen) |
| 3 | Payment done | Customer | `kilkeel_customer_payment_confirmed` | Text |
| 4 | Owner starts kitchen | Customer | `kilkeel_customer_preparing` | Text |
| 5 | Out for delivery | Customer | `kilkeel_customer_out_for_delivery` | Text |
| 6 | Delivered | Customer | `kilkeel_customer_delivered` | Text |
| Any | Cancellation | Customer | `kilkeel_customer_cancelled` | Text |
| Any | Cancellation | Owner | `kilkeel_owner_cancelled` | Text |

---

## Template 1 — `kilkeel_owner_new_order`

**Trigger:** Customer places order  
**Recipient:** Restaurant Owner  
**Type:** `twilio/quick-reply`  
**Buttons:** ✅ Accept | ❌ Decline  
**Note:** When owner taps a button, Twilio fires a webhook to `/api/webhooks/twilio/whatsapp` — we parse it and update order status automatically.

```json
{
  "friendly_name": "kilkeel_owner_new_order",
  "language": "en-GB",
  "variables": {
    "1": "ORD-A1B2C3D4",
    "2": "John Smith",
    "3": "Burger x1, Fries x2",
    "4": "12.99"
  },
  "types": {
    "twilio/quick-reply": {
      "body": "🛎️ New Order Received!\n\nOrder ID: #{{1}}\nCustomer: {{2}}\nItems: {{3}}\nTotal: £{{4}}\n\nPlease accept or decline this order.",
      "actions": [
        { "title": "✅ Accept Order", "id": "accept" },
        { "title": "❌ Decline Order", "id": "decline" }
      ]
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{2}}` | customer name |
| `{{3}}` | items summary e.g. "Burger x1, Fries x2" |
| `{{4}}` | order total amount |

---

## Template 2 — `kilkeel_customer_order_received`

**Trigger:** Customer places order  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_order_received",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co."
  },
  "types": {
    "twilio/text": {
      "body": "Hi {{1}}! 🛍️ We've received your order.\n\nOrder ID: #{{2}}\nRestaurant: {{3}}\n\nThe restaurant is reviewing your order now. We'll notify you as soon as it's accepted!"
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | restaurant name |

---

## Template 3 — `kilkeel_customer_pay_now`

**Trigger:** Owner accepts order (status → CONFIRMED)  
**Recipient:** Customer  
**Type:** `twilio/call-to-action` (URL button)  
**Important:** Payment URL must be included so customer can pay directly from WhatsApp.

```json
{
  "friendly_name": "kilkeel_customer_pay_now",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co.",
    "4": "12.99",
    "5": "https://kilkeeleats.com/checkout/order/abc123"
  },
  "types": {
    "twilio/call-to-action": {
      "body": "✅ Great news, {{1}}! Your order has been accepted.\n\nOrder ID: #{{2}}\nRestaurant: {{3}}\nAmount: £{{4}}\n\n⏳ You have 5 minutes to complete payment. After that, your order will be automatically cancelled.\n\nTap below to pay now 👇",
      "actions": [
        {
          "type": "URL",
          "title": "💳 Pay Now",
          "url": "{{5}}"
        }
      ]
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | restaurant name |
| `{{4}}` | total amount |
| `{{5}}` | Stripe checkout URL |

---

## Template 4 — `kilkeel_customer_order_declined`

**Trigger:** Owner declines order (status → CANCELLED with reason "Declined by restaurant")  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_order_declined",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co."
  },
  "types": {
    "twilio/text": {
      "body": "Hi {{1}}, unfortunately your order #{{2}} from {{3}} has been declined by the restaurant.\n\nYou have not been charged. Please try ordering again or choose a different restaurant.\n\nSorry for the inconvenience! 🙏"
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | restaurant name |

---

## Template 5 — `kilkeel_owner_payment_received`

**Trigger:** Customer pays (status → PAID)  
**Recipient:** Restaurant Owner  
**Type:** `twilio/quick-reply`  
**Note:** 2-minute grace period before kitchen starts. Button press fires webhook to move order to PREPARING.

```json
{
  "friendly_name": "kilkeel_owner_payment_received",
  "language": "en-GB",
  "variables": {
    "1": "ORD-A1B2C3D4",
    "2": "12.99"
  },
  "types": {
    "twilio/quick-reply": {
      "body": "💳 Payment received for Order #{{1}}!\n\nAmount: £{{2}}\n\n⏳ Please wait 2 minutes — the customer has a short window to cancel.\n\nAfter 2 minutes, tap below to start preparing 👇",
      "actions": [
        { "title": "👨‍🍳 Start Kitchen", "id": "start_kitchen" }
      ]
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{2}}` | total amount |

---

## Template 6 — `kilkeel_customer_payment_confirmed`

**Trigger:** Customer pays (status → PAID)  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_payment_confirmed",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co.",
    "4": "12.99"
  },
  "types": {
    "twilio/text": {
      "body": "🎉 Payment confirmed, {{1}}!\n\nOrder ID: #{{2}}\nRestaurant: {{3}}\nAmount paid: £{{4}}\n\nYou have 2 minutes if you need to cancel. After that, the kitchen will start preparing your food.\n\nSit tight — we'll update you shortly! 🍽️"
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | restaurant name |
| `{{4}}` | total amount |

---

## Template 7 — `kilkeel_customer_preparing`

**Trigger:** Owner moves order to PREPARING  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_preparing",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co."
  },
  "types": {
    "twilio/text": {
      "body": "👨‍🍳 Your food is being prepared!\n\nHi {{1}}, Order #{{2}} from {{3}} is now in the kitchen.\n\nWe'll let you know when it's on its way to you! 🛵"
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | restaurant name |

---

## Template 8 — `kilkeel_customer_out_for_delivery`

**Trigger:** Owner dispatches order (status → OUT_FOR_DELIVERY)  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_out_for_delivery",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co."
  },
  "types": {
    "twilio/text": {
      "body": "🛵 Your order is on its way!\n\nHi {{1}}, Order #{{2}} from {{3}} has been picked up and is heading to you now.\n\nGet ready — it should be with you soon! 🎉"
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | restaurant name |

---

## Template 9 — `kilkeel_customer_delivered`

**Trigger:** Order marked DELIVERED  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_delivered",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Kilkeel Burger Co."
  },
  "types": {
    "twilio/text": {
      "body": "✅ Your order has arrived!\n\nHi {{1}}, Order #{{2}} from {{3}} has been delivered. Enjoy your meal! 🍽️\n\nThank you for ordering with Kilkeel Eats. We hope to see you again soon!"
    }
  }
}
```

---

## Template 10 — `kilkeel_customer_cancelled`

**Trigger:** Any cancellation (auto-timeout, owner cancel, customer cancel)  
**Recipient:** Customer  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_customer_cancelled",
  "language": "en-GB",
  "variables": {
    "1": "John",
    "2": "ORD-A1B2C3D4",
    "3": "Restaurant did not respond in time"
  },
  "types": {
    "twilio/text": {
      "body": "❌ Order Cancelled\n\nHi {{1}}, your order #{{2}} has been cancelled.\n\nReason: {{3}}\n\nIf you were charged, a full refund will be processed within 3–5 business days. We're sorry for the inconvenience. 🙏"
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | customer name |
| `{{2}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{3}}` | cancellation reason (see below) |

**Cancellation reasons by trigger:**
| Trigger | Reason text |
|---------|------------|
| Auto 10-min timeout | `Restaurant did not respond in time` |
| Auto 5-min payment timeout | `Payment was not completed in time` |
| Owner declined | `Declined by the restaurant` |
| Customer cancelled | `Cancelled by you` |
| Owner cancelled after PAID | `Cancelled by the restaurant` |

---

## Template 11 — `kilkeel_owner_cancelled`

**Trigger:** Any cancellation  
**Recipient:** Restaurant Owner  
**Type:** `twilio/text`

```json
{
  "friendly_name": "kilkeel_owner_cancelled",
  "language": "en-GB",
  "variables": {
    "1": "ORD-A1B2C3D4",
    "2": "Customer cancelled after payment"
  },
  "types": {
    "twilio/text": {
      "body": "❌ Order Cancelled\n\nOrder #{{1}} has been cancelled.\n\nReason: {{2}}\n\nNo further action needed."
    }
  }
}
```

**Variables at runtime:**
| Var | Value |
|-----|-------|
| `{{1}}` | `orderId.slice(0,8).toUpperCase()` |
| `{{2}}` | cancellation reason |

---

## How to Create in Twilio

1. Go to **Twilio Console → Messaging → Content Template Builder**
2. Click **Create new template**
3. Set the **Template Name** exactly as shown above
4. Set language to **English (UK)**
5. For **Text** templates: paste the `body` text, replace `{{1}}` etc. with example values
6. For **Quick Reply** templates: select "Quick Reply" content type, add buttons with the exact title and ID shown
7. For **Call-to-Action** templates: select "Call to Action", add URL button
8. Submit for **WhatsApp approval**
9. Once approved, share the SID with me and I'll wire each one into the code

---

## Important: Quick Reply Webhook

Templates 1 and 5 have buttons (Accept/Decline/Start Kitchen).  
When owner taps a button in WhatsApp, Meta sends the reply back to our Twilio number.  
This needs a **Twilio incoming webhook** at `/api/webhooks/twilio/whatsapp` to:
- Parse which button was pressed (`accept` / `decline` / `start_kitchen`)
- Look up the pending order for that owner's phone number
- Automatically update the order status

**This webhook needs to be built after templates are approved.**  
Set it in Twilio Console → Phone Numbers → your WhatsApp sender → Messaging → Webhook URL.
