/**
 * manage-whatsapp-templates.mjs
 *
 * Reads template definitions from src/config/whatsapp-templates.ts
 * and manages them in Twilio via the Content API.
 *
 * Commands:
 *   node scripts/manage-whatsapp-templates.mjs list     — show all templates + live Twilio status
 *   node scripts/manage-whatsapp-templates.mjs create   — create all templates in Twilio
 *   node scripts/manage-whatsapp-templates.mjs recreate — delete old + create fresh (updates body text)
 *   node scripts/manage-whatsapp-templates.mjs status   — check Meta approval status for all SIDs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Credentials are read from environment variables — never hardcode secrets.
// Set these in your shell or .env before running:
//   export TWILIO_ACCOUNT_SID=ACxxx
//   export TWILIO_AUTH_TOKEN=xxx
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN env vars.");
  process.exit(1);
}

const CREDENTIALS = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");
const BASE_URL    = "https://content.twilio.com/v1/Content";

// ─── Read config from TS file (extract SIDs + definitions) ───────────────────

const configPath = resolve("src/config/whatsapp-templates.ts");
const configText = readFileSync(configPath, "utf8");

// Extract TEMPLATE_SIDS object
const sidMatch = configText.match(/export const TEMPLATE_SIDS[^=]+=\s*(\{[\s\S]*?\});/);
if (!sidMatch) { console.error("Could not parse TEMPLATE_SIDS from config"); process.exit(1); }
const TEMPLATE_SIDS = eval(`(${sidMatch[1]})`);

// Extract TEMPLATE_DEFINITIONS array (simplified — use hardcoded below for API calls)
// We re-declare the definitions here as plain JS so the script is standalone.

const BRAND  = "Your Local Eats";
const DOMAIN = "kilkeeleats.com";

const TEMPLATES = [
  {
    name: "kilkeel_owner_new_order",
    twilioType: "twilio/quick-reply",
    exampleVars: { "1":"A1B2C3D4","2":"John Smith","3":"12 Main St, Kilkeel","4":"Burger x1 — £8.99","5":"8.99","6":"3.75","7":"1.99","8":"14.73","9":"Kilkeel" },
    body: `🛎️ New Order #{{1}} — {{9}}\n\n👤 Customer: {{2}}\n🏠 Deliver to: {{3}}\n\n📋 Items:\n{{4}}\n\n💷 Subtotal:  £{{5}}\n🚗 Delivery:  £{{6}}\n⚡ Service:   £{{7}}\n──────────────────\n💰 TOTAL:     £{{8}}\n\nPlease accept or decline this order ⬇️\n\n— ${BRAND}`,
    buttons: [{ title:"✅ Accept Order", id:"accept" },{ title:"❌ Decline Order", id:"decline" }],
  },
  {
    name: "kilkeel_customer_order_received",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"Kilkeel" },
    body: `Hi {{1}}! 🛍️ We've received your order.\n\nOrder ID:   #{{2}}\nRestaurant: {{3}}\nLocation:   {{4}}\n\nThe restaurant is reviewing your order now. We'll notify you as soon as it's accepted!\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_customer_pay_now",
    twilioType: "twilio/call-to-action",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"Kilkeel","5":"14.73","6":"3f4a5b6c-1234-5678-abcd-ef0123456789" },
    body: `✅ Order Accepted, {{1}}!\n\nOrder ID:   #{{2}}\nRestaurant: {{3}}\nLocation:   {{4}}\n\n💰 Amount to Pay: £{{5}}\n\n⏳ You have 5 minutes to complete payment.\nAfter that, your order will be automatically cancelled.\n\nTap below to pay now 👇\n\n— ${BRAND}`,
    ctaButton: { type:"URL", title:"💳 Pay Now", url:`https://${DOMAIN}/orders/{{6}}` },
  },
  {
    name: "kilkeel_customer_order_declined",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"Kilkeel" },
    body: `Hi {{1}}, your order #{{2}} from {{3}} ({{4}}) has been declined by the restaurant.\n\nYou have not been charged. Please try ordering again or choose a different restaurant.\n\nSorry for the inconvenience! 🙏\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_owner_payment_received",
    twilioType: "twilio/quick-reply",
    exampleVars: { "1":"A1B2C3D4","2":"John Smith","3":"12 Main St, Kilkeel","4":"Burger x1 — £8.99","5":"14.73" },
    body: `💳 Payment Received! — Order #{{1}}\n\n👤 Customer: {{2}}\n🏠 Deliver to: {{3}}\n\n📋 Items:\n{{4}}\n\n💰 TOTAL: £{{5}}\n\n⏳ Please wait 2 minutes — the customer has a short cancellation window.\n\nAfter 2 minutes, tap below to start preparing 👇\n\n— ${BRAND}`,
    buttons: [{ title:"👨‍🍳 Start Kitchen", id:"start_kitchen" }],
  },
  {
    name: "kilkeel_customer_payment_confirmed",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"14.73" },
    body: `🎉 Payment Confirmed, {{1}}!\n\nOrder ID:    #{{2}}\nRestaurant:  {{3}}\nAmount Paid: £{{4}}\n\nYou have 2 minutes to cancel if needed.\nAfter that, the kitchen will start preparing your food.\n\nWe'll notify you when it's being prepared! 🍽️\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_customer_preparing",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"Kilkeel" },
    body: `👨‍🍳 Your food is being prepared!\n\nHi {{1}}, Order #{{2}} from {{3}} ({{4}}) is now in the kitchen.\n\nWe'll let you know when it's on its way to you! 🛵\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_customer_out_for_delivery",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"Kilkeel","5":"12 Main St, Kilkeel" },
    body: `🛵 Your order is on its way, {{1}}!\n\nOrder #{{2}} from {{3}} ({{4}}) has been picked up and is heading to you now.\n\n📍 Delivering to: {{5}}\n\nGet ready — it should be with you very soon! 🎉\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_customer_delivered",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co." },
    body: `✅ Your order has arrived!\n\nHi {{1}}, Order #{{2}} from {{3}} has been delivered. Enjoy your meal! 🍽️\n\nThank you for ordering with ${BRAND}. We hope to see you again soon!\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_customer_cancelled",
    twilioType: "twilio/text",
    exampleVars: { "1":"John","2":"A1B2C3D4","3":"Kilkeel Burger Co.","4":"Kilkeel","5":"Restaurant did not respond in time" },
    body: `❌ Order Cancelled\n\nHi {{1}}, your order #{{2}} from {{3}} ({{4}}) has been cancelled.\n\nReason: {{5}}\n\nIf you were charged, a full refund will be processed within 3–5 business days.\n\nSorry for the inconvenience! 🙏\n\n— ${BRAND}`,
  },
  {
    name: "kilkeel_owner_cancelled",
    twilioType: "twilio/text",
    exampleVars: { "1":"A1B2C3D4","2":"Customer cancelled after payment" },
    body: `❌ Order Cancelled — #{{1}}\n\nReason: {{2}}\n\nNo further action needed.\n\n— ${BRAND}`,
  },
];

// ─── Twilio API helpers ───────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Basic ${CREDENTIALS}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  return { ok: res.ok, status: res.status, data };
}

function buildPayload(t) {
  const payload = { friendly_name: t.name, language: "en_GB", variables: t.exampleVars, types: {} };
  if (t.twilioType === "twilio/text") {
    payload.types["twilio/text"] = { body: t.body };
  } else if (t.twilioType === "twilio/quick-reply") {
    payload.types["twilio/quick-reply"] = { body: t.body, actions: t.buttons };
  } else if (t.twilioType === "twilio/call-to-action") {
    payload.types["twilio/call-to-action"] = { body: t.body, actions: [t.ctaButton] };
  }
  return payload;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdStatus() {
  console.log("\n📋 Template approval status (live from Twilio)\n");
  console.log("─".repeat(72));
  for (const [name, sid] of Object.entries(TEMPLATE_SIDS)) {
    const { data } = await api("GET", `/${sid}/ApprovalRequests`);
    const wa = data?.whatsapp;
    const status = wa?.status ?? "unknown";
    const icon = status === "approved" ? "✅" : status === "pending" ? "⏳" : status === "rejected" ? "❌" : "❓";
    console.log(`  ${icon}  ${name}`);
    console.log(`      SID: ${sid}  |  Status: ${status}\n`);
  }
}

async function cmdList() {
  console.log("\n📋 All templates in Twilio account\n");
  const { data } = await api("GET", "?PageSize=50");
  const items = data?.contents ?? [];
  console.log(`  Found ${items.length} total templates\n`);
  for (const t of items) {
    const isMine = t.friendly_name.startsWith("kilkeel_");
    console.log(`  ${isMine ? "★" : " "} ${t.friendly_name}  (${t.sid})`);
  }
  console.log();
}

async function cmdCreate() {
  console.log("\n📝 Creating templates in Twilio...\n");
  const newSids = {};
  for (const t of TEMPLATES) {
    process.stdout.write(`  ${t.name}\n  Creating ... `);
    const { ok, data } = await api("POST", "", buildPayload(t));
    if (!ok) { process.stdout.write(`✗ ${data?.message}\n\n`); continue; }
    const sid = data.sid;
    process.stdout.write(`✓ ${sid}\n  Submitting for approval ... `);
    const { ok: aOk, status: aStatus, data: aData } = await api("POST", `/${sid}/ApprovalRequests/whatsapp`, { name: t.name, category: "UTILITY" });
    process.stdout.write(aOk || aStatus === 409 ? `✓ ${aData?.whatsapp?.status ?? "received"}\n\n` : `✗ ${aData?.message}\n\n`);
    newSids[t.name] = sid;
  }
  printSidUpdate(newSids);
}

async function cmdRecreate() {
  const oldSids = Object.values(TEMPLATE_SIDS);
  console.log(`\n🗑️  Deleting ${oldSids.length} existing templates...\n`);
  for (const sid of oldSids) {
    const { ok, status } = await api("DELETE", `/${sid}`);
    console.log(`  ${sid} → ${ok || status === 404 ? "✓ deleted" : `✗ ${status}`}`);
  }
  console.log();
  await cmdCreate();
}

function printSidUpdate(newSids) {
  console.log("─".repeat(72));
  console.log("\n✅ Update TEMPLATE_SIDS in src/config/whatsapp-templates.ts:\n");
  console.log("export const TEMPLATE_SIDS = {");
  for (const [name, sid] of Object.entries(newSids)) {
    const padding = " ".repeat(Math.max(0, 36 - name.length));
    console.log(`  ${name}:${padding}"${sid}",`);
  }
  console.log("};");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const cmd = process.argv[2] ?? "status";
const commands = { status: cmdStatus, list: cmdList, create: cmdCreate, recreate: cmdRecreate };

if (!commands[cmd]) {
  console.error(`Unknown command: ${cmd}\nUsage: node scripts/manage-whatsapp-templates.mjs [list|create|recreate|status]`);
  process.exit(1);
}

commands[cmd]().catch(console.error);
