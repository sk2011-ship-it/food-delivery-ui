import { NextResponse } from "next/server";
import { eq, or, and, isNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryJobs, orders, restaurants, orderMetrics, users, driverShiftLogs } from "@/lib/db/schema";
import { NotificationService } from "@/services/notification.service";
import { assignShipdayCarrierToOrder, listShipdayCarriers } from "@/lib/shipday";

console.log("[Shipday Webhook] Route file loaded");

export async function GET() {
  console.log("[Shipday Webhook] GET request received (health check)");
  return NextResponse.json({
    status: "alive",
    message: "Shipday Webhook endpoint is active and ready for POST requests.",
    timestamp: new Date().toISOString(),
  });
}

type ShipdayWebhookPayload = Record<string, unknown>;

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * When we create a Shipday order we send orderNumber = orderId.replace(/-/g,"")
 * (32 hex chars, no hyphens). Shipday echoes this back as order.order_number.
 * Our deliveryJobs.orderId stores the UUID WITH hyphens (36 chars).
 * This function re-adds the hyphens so the DB lookup matches.
 */
function rehyphenUuid(s: string): string {
  if (s.length === 32 && /^[0-9a-f]+$/i.test(s)) {
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  }
  return s; // already hyphenated or different format — pass through
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = readString(value);
    if (parsed) return parsed;
  }
  return null;
}

function pickFirstNestedString(
  sources: Array<Record<string, unknown> | null>,
  keys: string[]
): string | null {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const parsed = readString(source[key]);
      if (parsed) return parsed;
    }
  }
  return null;
}

function isLikelyCustomerName(value: string | null, customerName: string | null): boolean {
  if (!value || !customerName) return false;
  const v = value.trim().toLowerCase();
  const c = customerName.trim().toLowerCase();

  const log = (msg: string) => {
    try {
      require("fs").appendFileSync("/tmp/shipday_guard.log", `[${new Date().toISOString()}] ${msg}\n`);
    } catch { }
  };

  // Exact match
  if (v === c) {
    log(`BLOCK (Exact Match): "${value}" matches customer "${customerName}"`);
    return true;
  }
  // One name is contained within the other (handles "Shoya" vs "Shoya Ishida")
  if (v.includes(c) || c.includes(v)) {
    log(`BLOCK (Inclusive): "${value}" matches customer "${customerName}"`);
    return true;
  }
  // Any word in the customer name matches any word in the candidate (first/last name overlap)
  const vWords = v.split(/\s+/);
  const cWords = c.split(/\s+/);
  const overlap = vWords.some((w) => w.length > 2 && cWords.includes(w));
  if (overlap) {
    log(`BLOCK (Word Overlap): "${value}" matches customer "${customerName}"`);
    return true;
  }

  return false;
}

type MappedStatus = "DISPATCH_REQUESTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

function mapShipdayStatus(payload: ShipdayWebhookPayload): MappedStatus | null {
  const order = readObject(payload.order);
  const deliveryDetails = readObject(payload.delivery_details);

  // Shipday sends a top-level "event" field (e.g. "ORDER_COMPLETED", "ORDER_ONTHEWAY").
  // This is the most reliable signal — check it first.
  const eventField = readString(payload.event ?? payload.eventType ?? payload.event_type)?.toUpperCase();
  if (eventField) {
    if (
      eventField === "ORDER_COMPLETED" ||
      eventField === "ORDER_COMPLETE" ||
      eventField === "ORDER_DELIVERED" ||
      eventField === "ORDER_DONE" ||
      eventField === "DELIVERED"
    ) return "DELIVERED";
    if (eventField === "ORDER_ONTHEWAY" || eventField === "ORDER_PIKEDUP") return "OUT_FOR_DELIVERY";
    if (
      eventField === "ORDER_ASSIGNED" ||
      eventField === "ORDER_PRE_ASSIGNED" ||
      eventField === "ORDER_PREASSIGNED" ||
      eventField === "ORDER_DRIVER_ASSIGNED" ||
      eventField === "DRIVER_ASSIGNED" ||
      eventField === "ORDER_ACCEPTED_AND_STARTED"
    ) return "DISPATCH_REQUESTED";
    if (
      eventField === "ORDER_FAILED" ||
      eventField === "ORDER_INCOMPLETE" ||
      eventField === "ORDER_DELETE" ||
      eventField === "ORDER_UNASSIGNED"
    ) return "CANCELLED";
  }

  // Fallback: use the order_status field (e.g. "ALREADY_DELIVERED", "PICKED_UP", "STARTED")
  const rawStatus = pickFirstString(
    payload.orderStatus,
    payload.order_status,
    payload.status,
    payload.deliveryStatus,
    payload.delivery_status,
    order?.orderStatus,
    order?.order_status,
    deliveryDetails?.status,
    deliveryDetails?.delivery_status
  )?.toUpperCase();

  if (!rawStatus) return null;

  if (
    rawStatus.includes("PRE_ASSIGNED") ||
    rawStatus.includes("PREASSIGNED") ||
    rawStatus.includes("DRIVER_ASSIGNED") ||
    rawStatus.includes("ASSIGNED")
  ) {
    return "DISPATCH_REQUESTED";
  }

  if (
    rawStatus === "DELIVERED" ||
    rawStatus === "COMPLETED" ||
    rawStatus === "COMPLETE" ||
    rawStatus === "DONE" ||
    rawStatus === "FINISHED" ||
    rawStatus === "DELIVERY_COMPLETE" ||
    rawStatus === "DELIVERY_COMPLETED" ||
    rawStatus.includes("DELIVERED") ||
    rawStatus.includes("COMPLETED") ||
    rawStatus.includes("COMPLETE") ||
    rawStatus.includes("DONE") ||
    rawStatus.includes("FINISH")
  ) {
    return "DELIVERED";
  }
  // "PICKED_UP" and "ON_THE_WAY" mean driver has the food and is en-route → OUT_FOR_DELIVERY
  if (
    rawStatus.includes("OUT_FOR_DELIVERY") ||
    rawStatus.includes("ON_THE_WAY") ||
    rawStatus.includes("ONTHEWAY") ||
    rawStatus.includes("EN_ROUTE") ||
    rawStatus.includes("PICKED_UP") ||
    rawStatus.includes("PIKEDUP")
  ) {
    return "OUT_FOR_DELIVERY";
  }
  if (
    rawStatus.includes("FAILED") ||
    rawStatus.includes("INCOMPLETE") ||
    rawStatus.includes("CANCELLED")
  ) {
    return "CANCELLED";
  }
  // "STARTED" in Shipday = driver accepted & heading to restaurant (not yet picked up)
  // "ASSIGNED" = driver assigned to order — both map to DISPATCH_REQUESTED
  if (
    rawStatus.includes("NOT_ASSIGNED") ||
    rawStatus.includes("STARTED") ||
    rawStatus.includes("PENDING")
  ) {
    return "DISPATCH_REQUESTED";
  }
  return null;
}

// Valid source statuses for each transition.
// Broadened to handle Shipday skipping intermediate states (e.g. ASSIGNED then straight to DELIVERED).
const ALLOWED_TRANSITIONS: Record<MappedStatus, string[]> = {
  // Shipday can assign a rider while the order is still awaiting kitchen prep,
  // already being prepared, or even just paid/confirmed depending on workflow.
  DISPATCH_REQUESTED: ["CONFIRMED", "PAID", "PREPARING"],
  OUT_FOR_DELIVERY: ["DISPATCH_REQUESTED", "PREPARING", "PAID"],
  DELIVERED: ["OUT_FOR_DELIVERY", "DISPATCH_REQUESTED", "PREPARING", "PAID"],
  CANCELLED: ["DISPATCH_REQUESTED", "PREPARING", "PAID", "CONFIRMED", "PENDING_CONFIRMATION"],
};

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Shipday Webhook] [${requestId}] POST request received`);

  try {
    const payload: ShipdayWebhookPayload = await req.json();
    console.log(`[Shipday Webhook] RAW PAYLOAD [${requestId}]:`, JSON.stringify(payload, null, 2));

    if (!payload || Object.keys(payload).length === 0) {
      console.log("[Shipday Webhook] Received empty body (ping).");
      return NextResponse.json({ ok: true, message: "Ping received" });
    }

    const orderPayload = readObject(payload.order);

    console.log(`[Shipday Webhook] [${requestId}] Raw payload fields:`, {
      event: payload.event,
      eventType: payload.eventType,
      orderStatus: payload.orderStatus,
      order_status: payload.order_status,
      status: payload.status,
      deliveryStatus: payload.deliveryStatus,
      delivery_status: payload.delivery_status,
      orderId: payload.orderId,
      "order.id": orderPayload?.id,
      "order.order_number": orderPayload?.order_number,
    });

    // ── Token verification ─────────────────────────────────────────────────
    const expectedToken = process.env.SHIPDAY_WEBHOOK_TOKEN;
    if (expectedToken) {
      const url = new URL(req.url);
      const order = readObject(payload.order);
      const company = readObject(payload.company);
      const receivedToken = pickFirstString(
        payload.token,
        payload.verificationToken,
        payload.auth_token,
        payload.client_id,
        order?.token,
        company?.token,
        url.searchParams.get("token"),
        url.searchParams.get("apiKey"),
        req.headers.get("token"),
        req.headers.get("client_id"),
        req.headers.get("x-shipday-token"),
        req.headers.get("authorization")?.replace("Bearer ", "")
      );

      if (receivedToken !== expectedToken) {
        console.warn(`[Shipday Webhook] Unauthorized. Expected "${expectedToken}", got "${receivedToken}"`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("[Shipday Webhook] SHIPDAY_WEBHOOK_TOKEN not set — skipping auth.");
    }

    // ── Driver on/off shift event ──────────────────────────────────────────
    // A payload is a driver event only when it has carrier-specific shift fields
    // OR an explicit driver/carrier eventType — but NOT when it also has order identifiers
    // (Shipday includes driverId in order-assigned webhooks, which must not be mis-routed here).
    const eventType = readString(payload.eventType ?? payload.event_type ?? payload.type)?.toUpperCase();
    const hasOrderIdentifier =
      payload.orderId !== undefined ||
      payload.orderID !== undefined ||
      payload.orderNumber !== undefined ||
      payload.order_number !== undefined ||
      (readObject(payload.order) !== null);

    const hasShiftField =
      payload.isOnShift !== undefined ||
      payload.is_on_shift !== undefined ||
      payload.onShift !== undefined ||
      payload.isOnDuty !== undefined ||
      payload.is_on_duty !== undefined;

    const isDriverEvent =
      eventType?.includes("DRIVER") ||
      eventType?.includes("CARRIER") ||
      hasShiftField ||
      ((payload.carrierId !== undefined || payload.carrier_id !== undefined) && !hasOrderIdentifier);

    if (isDriverEvent) {
      const carrierId =
        readString(payload.carrierId ?? payload.carrier_id);

      // Resolve isOnShift from boolean fields or string status values
      // Shipday may use isOnShift, isOnDuty, status, or driverStatus
      const boolField = payload.isOnShift ?? payload.is_on_shift ?? payload.onShift ??
        payload.isOnDuty ?? payload.is_on_duty;

      const rawDriverStatus = readString(
        payload.status ?? payload.driverStatus ?? payload.driver_status ?? payload.carrierStatus
      )?.toUpperCase();

      // Resolve boolean — could be a boolean field or a string like "ON_DUTY" / "OFF_DUTY"
      let isOnShift: boolean | null = null;
      if (typeof boolField === "boolean") {
        isOnShift = boolField;
      } else if (typeof boolField === "number") {
        isOnShift = boolField === 1;
      } else if (boolField === "true") {
        isOnShift = true;
      } else if (boolField === "false") {
        isOnShift = false;
      } else if (rawDriverStatus) {
        if (
          rawDriverStatus === "ON" ||
          rawDriverStatus.includes("ON_DUTY") ||
          rawDriverStatus.includes("ON_SHIFT") ||
          rawDriverStatus === "ACTIVE" ||
          rawDriverStatus === "ONLINE"
        ) {
          isOnShift = true;
        } else if (
          rawDriverStatus === "OFF" ||
          rawDriverStatus.includes("OFF_DUTY") ||
          rawDriverStatus.includes("OFF_SHIFT") ||
          rawDriverStatus === "INACTIVE" ||
          rawDriverStatus === "OFFLINE"
        ) {
          isOnShift = false;
        }
      }

      console.log(`[Shipday Webhook] Resolved Driver Shift: carrierId=${carrierId}, eventType=${eventType}, isOnShift=${isOnShift}`);

      if (carrierId && isOnShift !== null) {
        // Update live status on the user record
        await db
          .update(users)
          .set({ isOnShift, updatedAt: new Date() })
          .where(eq(users.shipdayCarrierId, carrierId));

        // Log the shift event for activity timeline
        const [driver] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.shipdayCarrierId, carrierId))
          .limit(1);

        if (driver) {
          await db.insert(driverShiftLogs).values({
            driverId: driver.id,
            shipdayCarrierId: carrierId,
            isOnShift,
          });
        }

        console.log(`[Shipday Webhook] Driver ${carrierId} isOnShift=${isOnShift}`);

        // ── Retry unassigned orders when driver comes on shift ──────────────
        // Find DISPATCH_REQUESTED jobs with no driver assigned yet
        if (isOnShift && carrierId) {
          try {
            // Wait 2.5s for Shipday API state to synchronize before polling for carriers
            await new Promise(resolve => setTimeout(resolve, 2500));

            const unassigned = await db
              .select({
                id: deliveryJobs.id,
                orderId: deliveryJobs.orderId,
                providerOrderId: deliveryJobs.providerOrderId,
              })
              .from(deliveryJobs)
              .where(
                and(
                  inArray(deliveryJobs.status, ["DISPATCH_REQUESTED"] as any),
                  isNull(deliveryJobs.driverName)
                )
              )
              .limit(10);

            if (unassigned.length > 0) {
              console.log(
                `[Shipday Webhook] Driver ${carrierId} came on shift — ` +
                `attempting to assign ${unassigned.length} unassigned order(s).`
              );

              // Get all on-shift carriers so autoAssign can pick closest
              const { ShipdayService } = await import("@/services/shipday.service");

              for (const job of unassigned) {
                if (
                  !job.providerOrderId ||
                  job.providerOrderId === "LOCK" ||
                  job.providerOrderId === "null"
                ) continue;

                // Fetch restaurant coordinates for this order
                const [orderRow] = await db
                  .select({
                    lat: restaurants.latitude,
                    lng: restaurants.longitude,
                  })
                  .from(orders)
                  .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
                  .where(eq(orders.id, job.orderId))
                  .limit(1);

                void ShipdayService.autoAssignClosestDriver(
                  job.providerOrderId,
                  orderRow?.lat ? Number(orderRow.lat) : null,
                  orderRow?.lng ? Number(orderRow.lng) : null
                );
              }
            }
          } catch (retryErr) {
            console.error("[Shipday Webhook] Failed to retry unassigned orders:", retryErr);
          }
        }

        return NextResponse.json({ ok: true });
      }

      // Driver event but couldn't resolve status — log and acknowledge
      console.warn(`[Shipday Webhook] Driver event received but could not resolve status:`, {
        carrierId, rawDriverStatus, eventType,
      });
      return NextResponse.json({ ok: true });
    }

    // ── Identify the delivery job ──────────────────────────────────────────
    const order = readObject(payload.order);
    const deliveryDetails = readObject(payload.delivery_details);

    const providerOrderId =
      pickFirstString(payload.orderId, payload.orderID, payload.id, payload.orderNumber, payload.order_number) ||
      pickFirstNestedString([order, deliveryDetails], ["id", "orderId", "orderID", "orderNumber", "order_number"]);

    const trackingId =
      pickFirstString(payload.trackingId, payload.trackingID, payload.tracking_id) ||
      pickFirstNestedString([order, deliveryDetails], ["trackingId", "trackingID", "tracking_id"]);

    // Shipday sends back our orderNumber (UUID without hyphens) in order.order_number.
    // Re-add hyphens so it matches deliveryJobs.orderId (which stores UUID with hyphens).
    const rawLocalOrderId = pickFirstNestedString([order], ["order_number", "orderNumber"]);
    const localOrderId = rawLocalOrderId ? rehyphenUuid(rawLocalOrderId) : null;

    if (!providerOrderId && !trackingId && !localOrderId) {
      console.warn("[Shipday Webhook] Missing order identifier:", payload);
      return NextResponse.json({ error: "Missing Shipday order identifier." }, { status: 400 });
    }

    const lookupConditions = [];
    if (providerOrderId) lookupConditions.push(eq(deliveryJobs.providerOrderId, providerOrderId));
    if (trackingId) lookupConditions.push(eq(deliveryJobs.trackingId, trackingId));
    if (localOrderId) lookupConditions.push(eq(deliveryJobs.orderId, localOrderId));

    const deliveryJob = await db.query.deliveryJobs.findFirst({
      where: lookupConditions.length === 1 ? lookupConditions[0] : or(...lookupConditions),
    });

    if (!deliveryJob) {
      console.warn("[Shipday Webhook] Delivery job not found:", { providerOrderId, trackingId, localOrderId });
      return NextResponse.json({ error: "Delivery job not found." }, { status: 404 });
    }

    const mappedStatus = mapShipdayStatus(payload);
    const rawStatusLabel =
      pickFirstString(payload.orderStatus, payload.order_status, payload.status, payload.deliveryStatus, payload.delivery_status) ||
      "unknown";

    console.log(`[Shipday Webhook] [${requestId}] "${rawStatusLabel}" → "${mappedStatus}" for order ${deliveryJob.orderId}`);

    // ── Step 1: Always update deliveryJobs with latest driver/tracking info ─
    // Shipday puts driver info in a "carrier" object inside order event payloads.
    const carrier = readObject(
      payload.carrier ??
      payload.assigned_carrier ??
      payload.assignedCarrier ??
      order?.assignedCarrier ??
      order?.assigned_carrier ??
      deliveryDetails?.assignedCarrier ??
      deliveryDetails?.assigned_carrier
    );
    const assignedDriver = readObject(payload.assigned_driver ?? payload.assignedDriver ?? payload.driver);
    const orderId = deliveryJob.orderId;

    const [currentOrderUser] = await db
      .select({ name: users.name })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);
    const customerName = currentOrderUser?.name ?? null;

    const orderCustomer = readObject(orderPayload?.customer);
    const customerNameFromPayload = readString(orderCustomer?.name);

    const djUpdate: Record<string, string | Date | null> = {
      providerOrderId: providerOrderId || deliveryJob.providerOrderId,
      trackingId: trackingId || deliveryJob.trackingId,
      trackingUrl:
        pickFirstNestedString([payload, order, deliveryDetails], ["trackingUrl", "trackingURL", "tracking_url", "trackUrl", "trackURL"]) ||
        deliveryJob.trackingUrl,
      driverName: (() => {
        const candidates = [
          { name: pickFirstNestedString([carrier, order?.assignedCarrier as Record<string, unknown> | null, deliveryDetails?.assignedCarrier as Record<string, unknown> | null], ["name", "driverName", "driver_name"]), source: "carrier/assignedCarrier" },
          { name: pickFirstNestedString([assignedDriver], ["name", "driverName", "driver_name"]), source: "assignedDriver" },
          { name: pickFirstNestedString([deliveryDetails], ["driverName", "driver_name"]), source: "deliveryDetails" },
        ];

        for (const { name, source } of candidates) {
          if (!name) continue;

          // Check against DB customer name AND payload customer name
          // Added Hard-coded block for "Shoya Ishida" to prevent any leakage if DB lookup is slow
          const isHardCodedBlock = name.toLowerCase().includes("ishida") || name.toLowerCase().includes("shoya");
          const isCustomer = isHardCodedBlock || isLikelyCustomerName(name, customerName) || isLikelyCustomerName(name, customerNameFromPayload);

          if (!isCustomer) {
            console.log(`[Shipday Webhook] [${requestId}] Valid driver name "${name}" found from ${source}`);
            return name;
          } else {
            console.warn(`[Shipday Webhook] [${requestId}] Blocked candidate "${name}" from ${source} - looks like customer name ("${customerName || customerNameFromPayload}")`);
          }
        }

        // If we currently have a valid driver name in the DB, keep it.
        // If the current DB name ALSO looks like the customer, null it out.
        if (deliveryJob.driverName && !isLikelyCustomerName(deliveryJob.driverName, customerName) && !isLikelyCustomerName(deliveryJob.driverName, customerNameFromPayload)) {
          return deliveryJob.driverName;
        }

        return null;
      })(),
      driverPhone: (() => {
        // Carrier (= assignedCarrier) phone is always the real driver — check first
        const carrierPhone = pickFirstNestedString(
          [carrier, order?.assignedCarrier as Record<string, unknown> | null, deliveryDetails?.assignedCarrier as Record<string, unknown> | null],
          ["phoneNumber", "phone", "phone_number"]
        );
        if (carrierPhone) return carrierPhone;

        const assignedDriverPhone = pickFirstNestedString(
          [assignedDriver],
          ["phoneNumber", "phone", "phone_number", "mobile"]
        );
        if (assignedDriverPhone) return assignedDriverPhone;

        // On broad sources (payload/deliveryDetails) only trust explicit driver-phone keys
        // to avoid the customer's phone number leaking into the driver contact field
        const detailsPhone = pickFirstNestedString(
          [deliveryDetails, payload],
          ["driverPhone", "driver_phone"]
        );
        if (detailsPhone) return detailsPhone;

        return deliveryJob.driverPhone;
      })(),
      eta:
        pickFirstNestedString([payload, deliveryDetails], ["eta", "estimatedDeliveryTime", "estimatedArrival", "estimated_arrival"]) ||
        deliveryJob.eta,
      updatedAt: new Date(),
    };
    if (mappedStatus) djUpdate.status = mappedStatus;

    await db.update(deliveryJobs).set(djUpdate).where(eq(deliveryJobs.id, deliveryJob.id));

    if (!mappedStatus) {
      console.log(`[Shipday Webhook] No mappable status in payload — delivery job updated only.`);
      return NextResponse.json({ ok: true });
    }

    // ── Step 2: Update order status if transition is valid ─────────────────
    const [currentOrder] = await db
      .select({ status: orders.status, userId: orders.userId, restaurantId: orders.restaurantId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrder) {
      console.warn(`[Shipday Webhook] Order ${orderId} not found.`);
      return NextResponse.json({ ok: true });
    }

    const allowed = ALLOWED_TRANSITIONS[mappedStatus];
    if (!allowed.includes(currentOrder.status)) {
      console.log(
        `[Shipday Webhook] Transition ${currentOrder.status} → ${mappedStatus} not allowed. Skipping order update.`
      );
      // Still notify UIs so driver details (already saved) appear immediately
      await notifyBoth(orderId, currentOrder.userId, currentOrder.restaurantId, mappedStatus, false);
      return NextResponse.json({ ok: true });
    }

    // Apply status update
    await db
      .update(orders)
      .set({ status: mappedStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Update orderMetrics timestamps
    const now = new Date();
    const metricsUpdate: Record<string, Date | number> = {};
    if (mappedStatus === "OUT_FOR_DELIVERY") metricsUpdate.dispatchedAt = now;
    if (mappedStatus === "DELIVERED") metricsUpdate.deliveredAt = now;
    if (Object.keys(metricsUpdate).length > 0) {
      await db.update(orderMetrics).set(metricsUpdate).where(eq(orderMetrics.orderId, orderId)).catch(() => {
        // orderMetrics row may not exist for older orders — ignore
      });
    }

    console.log(`[Shipday Webhook] Order ${orderId} updated: ${currentOrder.status} → ${mappedStatus}`);

    // ── Step 3: Notify customer and owner ──────────────────────────────────
    await notifyBoth(orderId, currentOrder.userId, currentOrder.restaurantId, mappedStatus, true);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Shipday Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}

// ── Notification helper ────────────────────────────────────────────────────────

async function notifyBoth(
  orderId: string,
  userId: string | null,
  restaurantId: string,
  mappedStatus: MappedStatus,
  statusChanged: boolean
) {
  try {
    const [restaurant] = await db
      .select({ ownerId: restaurants.ownerId, name: restaurants.name })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    // Get current driver info from DB to verify if we actually HAVE a rider yet
    const [job] = await db
      .select({ driverName: deliveryJobs.driverName })
      .from(deliveryJobs)
      .where(eq(deliveryJobs.orderId, orderId))
      .limit(1);

    // If status is DISPATCH_REQUESTED but we have no driver name yet, 
    // skip the "Rider Assigned" notification as it is misleading.
    if (mappedStatus === "DISPATCH_REQUESTED" && !job?.driverName) {
      console.log(`[Shipday Webhook] Suppressing "Rider Assigned" notification for ${orderId} - no driver linked yet.`);
      return;
    }

    const shortId = orderId.slice(0, 8);
    const channels: ("FCM" | "WHATSAPP")[] =
      mappedStatus === "DELIVERED" || mappedStatus === "CANCELLED"
        ? ["FCM", "WHATSAPP"]
        : ["FCM"];

    const notifMap: Record<MappedStatus, { customerSubject: string; customerBody: string; ownerBody: string }> = {
      DISPATCH_REQUESTED: {
        customerSubject: "Rider Assigned",
        customerBody: `A rider has been assigned to your order #${shortId}. They will pick up your food soon.`,
        ownerBody: `A rider has been assigned to order #${shortId} and is heading to you for pickup.`,
      },
      OUT_FOR_DELIVERY: {
        customerSubject: "Order On The Way!",
        customerBody: `Your order #${shortId} from ${restaurant?.name ?? "the restaurant"} has been picked up and is on its way to you!`,
        ownerBody: `Order #${shortId} has been picked up by the rider and is out for delivery.`,
      },
      DELIVERED: {
        customerSubject: "Order Delivered! 🎉",
        customerBody: `Your order #${shortId} from ${restaurant?.name ?? "the restaurant"} has been delivered. Enjoy your meal! 🍴`,
        ownerBody: `Order #${shortId} has been successfully delivered to the customer.`,
      },
      CANCELLED: {
        customerSubject: "Order Cancelled",
        customerBody: `Your order #${shortId} was cancelled.`,
        ownerBody: `Order #${shortId} was cancelled by the delivery provider.`,
      },
    };

    const notif = notifMap[mappedStatus];

    if (userId) {
      await NotificationService.dispatchOrderNotifications({
        userId,
        type: "ORDER",
        subject: notif.customerSubject,
        body: notif.customerBody,
        metadata: { orderId, orderStatus: mappedStatus, targetRole: "customer" },
        channels,
      });
    }

    if (restaurant?.ownerId) {
      await NotificationService.dispatchOrderNotifications({
        userId: restaurant.ownerId,
        type: "ORDER",
        subject: statusChanged ? notif.customerSubject : "Driver Update",
        body: notif.ownerBody,
        metadata: { orderId, orderStatus: mappedStatus, targetRole: "owner" },
        channels,
      });
    }
  } catch (err) {
    console.error("[Shipday Webhook] Notification failed:", err);
  }
}
