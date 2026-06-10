# WhatsApp Number Migration — +15559304359 → +44 7480 559819

## Problem with old number (+15559304359)

- Free Meta WhatsApp number — untested in Twilio's system
- Cannot send outbound business-initiated messages (error 63051)
- Twilio support confirmed this in ticket #27138430 — recommended switching to a real Twilio number

## New number: +44 7480 559819

- Real UK Twilio number from inventory
- Added to Meta WhatsApp Manager under kilkeel_eats WABA (2004005780195335)
- Needs phone number verification before it can send messages

## Verification blocker — IMPORTANT

**+44 7480 559819 is a virtual Twilio number — it has NO real carrier SMS inbox.**

This means:
- Meta OTP via SMS will NOT appear in Twilio message logs
- Meta OTP via SMS goes directly via carrier network — Twilio programmable messaging has nothing to do with it
- Webhook on the number also does NOT help for carrier-level SMS

## What actually works for verification

**Only option: Phone Call**

1. On Meta WhatsApp Manager > Phone numbers > +44 7480 559819 > "Send verification code"
2. Change method to **Phone call** (not SMS)
3. Call will come in on the number
4. Go to **Twilio Console > Monitor > Logs > Call Logs** — call will be there with a recording
5. Listen to recording — Meta will say the OTP code
6. Enter that code in Meta to complete verification

## Current status (2026-06-10)

- +44 7480 559819 added to Meta kilkeel_eats WABA ✅
- Phone number verification still pending ❌
- Verification method: must use Phone Call — SMS will not work on virtual numbers

## After verification is done

Update these files:
- `.env` — `TWILIO_WHATSAPP_NUMBER=+447480559819`
- `.env.production` — same
- Tell Claude to sync env vars and redeploy
