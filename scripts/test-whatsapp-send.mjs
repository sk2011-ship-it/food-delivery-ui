/**
 * test-whatsapp-send.mjs
 *
 * Sends a live WhatsApp test message via Twilio using an approved template.
 *
 * Usage:
 *   node scripts/test-whatsapp-send.mjs <phone> [template]
 *
 * Examples:
 *   node scripts/test-whatsapp-send.mjs +447712345678
 *   node scripts/test-whatsapp-send.mjs +447712345678 customer_preparing
 *   node scripts/test-whatsapp-send.mjs +447712345678 customer_delivered
 *
 * Available templates (approved by Meta):
 *   customer_order_received    — "We received your order"
 *   customer_order_declined    — "Your order was declined"
 *   customer_payment_confirmed — "Payment confirmed"
 *   customer_preparing         — "Food is being prepared"
 *   customer_out_for_delivery  — "Order is on its way"
 *   customer_delivered         — "Order delivered"
 *   customer_cancelled         — "Order cancelled"
 *   owner_cancelled            — "Order cancelled (owner view)"
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
  console.error("Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_NUMBER env vars.");
  process.exit(1);
}

const toArg = process.argv[2];
if (!toArg) {
  console.error("Usage: node scripts/test-whatsapp-send.mjs <phone> [template]");
  console.error("Example: node scripts/test-whatsapp-send.mjs +447712345678");
  process.exit(1);
}

const templateArg = process.argv[3] ?? "customer_order_received";

// ── Approved template SIDs + test variables ──────────────────────────────────

const TEMPLATES = {
  customer_order_received: {
    sid: "HX75b010777cbbebb3d83ac6afb1e1460a",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co.","4":"Kilkeel" },
  },
  customer_order_declined: {
    sid: "HX6779ea1577d9f2ee38f63ba88770ddd7",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co.","4":"Kilkeel" },
  },
  customer_payment_confirmed: {
    sid: "HX9a8708c223233873a99bcd21b4fc7358",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co.","4":"14.73" },
  },
  customer_preparing: {
    sid: "HX0eeafbe750a0308c0694c5f2afc5b516",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co.","4":"Kilkeel" },
  },
  customer_out_for_delivery: {
    sid: "HXdae2ff3037e79c49b0b5dbf06a74db40",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co.","4":"Kilkeel","5":"12 Main St, Kilkeel" },
  },
  customer_delivered: {
    sid: "HX0e54947fa6b5eee9de3193016dd44976",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co." },
  },
  customer_cancelled: {
    sid: "HXdd8248f184953bbb0ca7f2adc90c84cf",
    vars: { "1":"Test User","2":"TESTABCD","3":"Kilkeel Burger Co.","4":"Kilkeel","5":"Restaurant did not respond in time" },
  },
  owner_cancelled: {
    sid: "HX1354495d8b234f51c33dfded404d65c6",
    vars: { "1":"TESTABCD","2":"Customer cancelled after payment" },
  },
};

const template = TEMPLATES[templateArg];
if (!template) {
  console.error(`Unknown template: "${templateArg}"`);
  console.error("Available:", Object.keys(TEMPLATES).join(", "));
  process.exit(1);
}

const toPhone = toArg.startsWith("+") ? toArg : `+${toArg.replace(/\D/g, "")}`;
const fromWhatsApp = FROM_NUMBER.startsWith("whatsapp:") ? FROM_NUMBER : `whatsapp:${FROM_NUMBER}`;
const toWhatsApp   = `whatsapp:${toPhone}`;

console.log(`\n📱 Sending WhatsApp test message`);
console.log(`   Template : ${templateArg}`);
console.log(`   SID      : ${template.sid}`);
console.log(`   From     : ${fromWhatsApp}`);
console.log(`   To       : ${toWhatsApp}`);
console.log(`   Variables: ${JSON.stringify(template.vars)}\n`);

const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

const body = new URLSearchParams({
  From:             fromWhatsApp,
  To:               toWhatsApp,
  ContentSid:       template.sid,
  ContentVariables: JSON.stringify(template.vars),
});

const res = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
  {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  }
);

const data = await res.json();

if (res.ok) {
  console.log(`✅ Message sent!`);
  console.log(`   Message SID : ${data.sid}`);
  console.log(`   Status      : ${data.status}`);
  console.log(`   To          : ${data.to}`);
} else {
  console.error(`❌ Failed to send message`);
  console.error(`   HTTP Status : ${res.status}`);
  console.error(`   Error Code  : ${data.code}`);
  console.error(`   Message     : ${data.message}`);
  if (data.more_info) console.error(`   More info   : ${data.more_info}`);
  process.exit(1);
}
