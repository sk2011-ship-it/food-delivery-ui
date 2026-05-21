import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryJobs, orders, restaurants, orderMetrics, users, driverShiftLogs } from "@/lib/db/schema";
import { NotificationService } from "@/services/notification.service";

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

type MappedStatus = "DISPATCH_REQUESTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

function mapShipdayStatus(payload: ShipdayWebhookPayload): MappedStatus | null {
  const order = readObject(payload.order);
  const deliveryDetails = readObject(payload.delivery_details);
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
    rawStatus === "DELIVERED" ||
    rawStatus === "COMPLETED" ||
    rawStatus === "COMPLETE" ||
    rawStatus.includes("DELIVERED") ||
    rawStatus.includes("COMPLETED")
  ) {
    return "DELIVERED";
  }
  if (
    rawStatus.includes("OUT_FOR_DELIVERY") ||
    rawStatus.includes("ON_THE_WAY") ||
    rawStatus.includes("EN_ROUTE") ||
    rawStatus.includes("PICKED_UP") ||
    rawStatus.includes("STARTED")
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
  if (
    rawStatus.includes("PRE_ASSIGNED") ||
    rawStatus.includes("ASSIGNED") ||
    rawStatus.includes("NOT_ASSIGNED") ||
    rawStatus.includes("PENDING")
  ) {
    return "DISPATCH_REQUESTED";
  }
  return null;
}

// Valid source statuses for each transition.
// OUT_FOR_DELIVERY requires DISPATCH_REQUESTED first — driver must be assigned
// before they can be picking up. This prevents instant PAID → OUT_FOR_DELIVERY jumps.
const ALLOWED_TRANSITIONS: Record<MappedStatus, string[]> = {
  DISPATCH_REQUESTED: ["PREPARING"],
  OUT_FOR_DELIVERY:   ["DISPATCH_REQUESTED", "PREPARING"],
  DELIVERED:          ["OUT_FOR_DELIVERY", "DISPATCH_REQUESTED"],
  CANCELLED:          ["DISPATCH_REQUESTED", "PREPARING", "PAID", "CONFIRMED", "PENDING_CONFIRMATION"],
};

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Shipday Webhook] [${requestId}] POST request received`);

  try {
    const body = await req.text();
    if (!body) {
      console.log("[Shipday Webhook] Received empty body (ping).");
      return NextResponse.json({ ok: true, message: "Ping received" });
    }

    let payload: ShipdayWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      console.error("[Shipday Webhook] Invalid JSON:", body);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log(`[Shipday Webhook] [${requestId}] Raw status fields:`, {
      orderStatus: payload.orderStatus,
      order_status: payload.order_status,
      status: payload.status,
      deliveryStatus: payload.deliveryStatus,
      delivery_status: payload.delivery_status,
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
    const eventType = readString(payload.eventType ?? payload.event_type ?? payload.type)?.toUpperCase();
    const isDriverEvent =
      eventType?.includes("DRIVER") ||
      eventType?.includes("CARRIER") ||
      payload.carrierId !== undefined ||
      payload.carrier_id !== undefined ||
      payload.driverId !== undefined;

    if (isDriverEvent) {
      const carrierId =
        readString(payload.carrierId ?? payload.carrier_id ?? payload.driverId ?? payload.driver_id);

      const rawDriverStatus = readString(
        payload.isOnShift ?? payload.is_on_shift ?? payload.onShift ??
        payload.status ?? payload.driverStatus ?? payload.driver_status
      )?.toUpperCase();

      // Resolve boolean — could be a boolean field or a string like "ON_DUTY" / "OFF_DUTY"
      let isOnShift: boolean | null = null;
      if (typeof (payload.isOnShift ?? payload.is_on_shift ?? payload.onShift) === "boolean") {
        isOnShift = Boolean(payload.isOnShift ?? payload.is_on_shift ?? payload.onShift);
      } else if (rawDriverStatus) {
        if (rawDriverStatus.includes("ON") || rawDriverStatus === "ACTIVE" || rawDriverStatus === "ONLINE") {
          isOnShift = true;
        } else if (rawDriverStatus.includes("OFF") || rawDriverStatus === "INACTIVE" || rawDriverStatus === "OFFLINE") {
          isOnShift = false;
        }
      }

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
            driverId:         driver.id,
            shipdayCarrierId: carrierId,
            isOnShift,
          });
        }

        console.log(`[Shipday Webhook] Driver ${carrierId} isOnShift=${isOnShift}`);
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

    const localOrderId = pickFirstNestedString([order], ["order_number", "orderNumber"]);

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
    const djUpdate: Record<string, string | Date | null> = {
      providerOrderId: providerOrderId || deliveryJob.providerOrderId,
      trackingId: trackingId || deliveryJob.trackingId,
      trackingUrl:
        pickFirstNestedString([payload, order, deliveryDetails], ["trackingUrl", "trackingURL", "tracking_url"]) ||
        deliveryJob.trackingUrl,
      driverName:
        pickFirstNestedString([payload, deliveryDetails], ["driverName", "driver_name", "driver"]) ||
        deliveryJob.driverName,
      driverPhone:
        pickFirstNestedString([payload, deliveryDetails], ["driverPhone", "driver_phone", "phone"]) ||
        deliveryJob.driverPhone,
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
    const orderId = deliveryJob.orderId;

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
