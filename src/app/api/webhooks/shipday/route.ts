import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryJobs, orders, restaurants, notifications, orderItems, menuItems, notificationChannelEnum } from "@/lib/db/schema";
import { NotificationService } from "@/services/notification.service";

console.log("[Shipday Webhook] Route file loaded");

export async function GET() {
  console.log("[Shipday Webhook] GET request received (health check)");
  return NextResponse.json({ 
    status: "alive", 
    message: "Shipday Webhook endpoint is active and ready for POST requests.",
    timestamp: new Date().toISOString()
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

function mapShipdayStatus(payload: ShipdayWebhookPayload) {
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
    return "DELIVERED" as const;
  }
  if (
    rawStatus.includes("OUT_FOR_DELIVERY") ||
    rawStatus.includes("ON_THE_WAY") ||
    rawStatus.includes("EN_ROUTE") ||
    rawStatus.includes("PICKED_UP") ||
    rawStatus.includes("STARTED")
  ) {
    return "OUT_FOR_DELIVERY" as const;
  }
  if (
    rawStatus.includes("FAILED") ||
    rawStatus.includes("INCOMPLETE") ||
    rawStatus.includes("CANCELLED")
  ) {
    return "CANCELLED" as const;
  }
  if (
    rawStatus.includes("PRE_ASSIGNED") ||
    rawStatus.includes("ASSIGNED") ||
    rawStatus.includes("NOT_ASSIGNED") ||
    rawStatus.includes("PENDING")
  ) {
    return "DISPATCH_REQUESTED" as const;
  }
  return null;
}

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
      console.error("[Shipday Webhook] Invalid JSON or unexpected end of input:", body);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log(`[Shipday Webhook] Raw status fields:`, {
      orderStatus: payload.orderStatus,
      order_status: payload.order_status,
      status: payload.status,
      deliveryStatus: payload.deliveryStatus,
      delivery_status: payload.delivery_status,
    });

    // Verify token if configured
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
        console.warn(`[Shipday Webhook] Unauthorized.`);
        console.warn(`- Expected: "${expectedToken}"`);
        console.warn(`- Received: "${receivedToken}"`);
        console.warn(`- Payload keys: ${Object.keys(payload).join(", ")}`);
        console.warn(`- Headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("[Shipday Webhook] Warning: SHIPDAY_WEBHOOK_TOKEN is not set in environment variables.");
    }

    const order = readObject(payload.order);
    const deliveryDetails = readObject(payload.delivery_details);

    const providerOrderId = pickFirstString(
      payload.orderId,
      payload.orderID,
      payload.id,
      payload.orderNumber,
      payload.order_number
    ) || pickFirstNestedString(
      [order, deliveryDetails],
      ["id", "orderId", "orderID", "orderNumber", "order_number"]
    );
    const trackingId = pickFirstString(
      payload.trackingId,
      payload.trackingID,
      payload.tracking_id
    ) || pickFirstNestedString(
      [order, deliveryDetails],
      ["trackingId", "trackingID", "tracking_id"]
    );
    const localOrderId = pickFirstNestedString(
      [order],
      ["order_number", "orderNumber"]
    );

    if (!providerOrderId && !trackingId && !localOrderId) {
      console.warn("[Shipday Webhook] Missing order identifier in payload:", payload);
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
      console.warn("[Shipday Webhook] Delivery job not found for identifiers:", {
        providerOrderId,
        trackingId,
        localOrderId,
      });
      return NextResponse.json({ error: "Delivery job not found." }, { status: 404 });
    }

    const mappedStatus = mapShipdayStatus(payload);
    const rawStatusLabel = pickFirstString(
      payload.orderStatus,
      payload.order_status,
      payload.status,
      payload.deliveryStatus,
      payload.delivery_status
    ) || "unknown";

    console.log(`[Shipday Webhook] Raw Status: "${rawStatusLabel}" -> Mapped: "${mappedStatus}"`);

    const updateDeliveryJob: Record<string, string | Date | null> = {
      providerOrderId: providerOrderId || deliveryJob.providerOrderId,
      trackingId: trackingId || deliveryJob.trackingId,
      trackingUrl: pickFirstNestedString(
        [payload, order, deliveryDetails],
        ["trackingUrl", "trackingURL", "tracking_url"]
      ) || deliveryJob.trackingUrl,
      driverName: pickFirstNestedString(
        [payload, deliveryDetails],
        ["driverName", "driver_name", "driver"]
      ) || deliveryJob.driverName,
      driverPhone: pickFirstNestedString(
        [payload, deliveryDetails],
        ["driverPhone", "driver_phone", "phone"]
      ) || deliveryJob.driverPhone,
      eta: pickFirstNestedString(
        [payload, deliveryDetails],
        ["eta", "estimatedDeliveryTime", "estimatedArrival", "estimated_arrival"]
      ) || deliveryJob.eta,
      updatedAt: new Date(),
    };

    if (mappedStatus) {
      updateDeliveryJob.status = mappedStatus;
    }

    await db
      .update(deliveryJobs)
      .set(updateDeliveryJob)
      .where(eq(deliveryJobs.id, deliveryJob.id));

    // 3. Update the Order Status (STRICTLY CONTROLLED)
    // We only allow the webhook to advance the order to terminal states (DELIVERED/CANCELLED).
    // The "OUT_FOR_DELIVERY" status MUST be triggered by the owner in the dashboard.
    const isTerminal = mappedStatus === "DELIVERED" || mappedStatus === "CANCELLED";
    console.log(`[Shipday Webhook Debug] OrderId: ${deliveryJob.orderId}, MappedStatus: ${mappedStatus}, isTerminal: ${isTerminal}`);

    // HARD BLOCK: Never allow OUT_FOR_DELIVERY from webhook
    if (mappedStatus === "OUT_FOR_DELIVERY") {
      console.log(`[Shipday Webhook] REJECTED OUT_FOR_DELIVERY for ${deliveryJob.orderId}. Owner must dispatch manually.`);
      return NextResponse.json({ ok: true, message: "Logistics updated, order status preserved." });
    }

    if (isTerminal) {
      const orderId = deliveryJob.orderId;

      const [currentOrder] = await db
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      const allowedTransitions: Record<string, string[]> = {
        DELIVERED: ["OUT_FOR_DELIVERY", "DISPATCH_REQUESTED", "PREPARING", "PAID", "CONFIRMED"],
        CANCELLED: ["DISPATCH_REQUESTED", "PREPARING", "PAID", "CONFIRMED", "PENDING_CONFIRMATION"],
      };

      if (!currentOrder || !allowedTransitions[mappedStatus]?.includes(currentOrder.status)) {
        console.warn(
          `[Shipday Webhook] BLOCKED ${mappedStatus} for order ${orderId}. ` +
          `Current status "${currentOrder?.status}" is not a valid source for this transition.`
        );
        return NextResponse.json({ ok: true, message: "Transition blocked — invalid status." });
      }

      await db
        .update(orders)
        .set({
          status: mappedStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // --- Notify for terminal states ---
      try {
        const [orderData] = await db
          .select({
            orderId: orders.id,
            userId: orders.userId,
            restaurantId: orders.restaurantId,
            restaurantName: restaurants.name,
            ownerId: restaurants.ownerId,
            totalAmount: orders.totalAmount,
          })
          .from(orders)
          .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
          .where(eq(orders.id, orderId))
          .limit(1);

        if (orderData) {
          const statusText = mappedStatus.replace(/_/g, " ").toLowerCase();
          const subject = mappedStatus === "DELIVERED" ? "Order Delivered! 🎉" : `Order Update: #${orderData.orderId.slice(0, 8)}`;

          const customerBody = mappedStatus === "DELIVERED"
            ? `Congratulations! Your order #${orderData.orderId.slice(0, 8)} from ${orderData.restaurantName} is successfully delivered. Enjoy your meal! 🍴`
            : `Your order #${orderData.orderId.slice(0, 8)} from ${orderData.restaurantName} was ${statusText.toUpperCase()}.`;

          // Notify Owner
          if (orderData.ownerId) {
            await NotificationService.dispatchOrderNotifications({
              userId: orderData.ownerId,
              type: "ORDER",
              subject,
              body: `Order #${orderData.orderId.slice(0, 8)}: ${statusText.toUpperCase()}`,
              metadata: { orderId: orderData.orderId, orderStatus: mappedStatus, targetRole: "owner" },
              channels: ["FCM", "WHATSAPP"]
            });
          }

          // Notify Customer
          if (orderData.userId) {
            await NotificationService.dispatchOrderNotifications({
              userId: orderData.userId,
              type: "ORDER",
              subject,
              body: customerBody,
              metadata: { orderId: orderData.orderId, orderStatus: mappedStatus, targetRole: "customer" },
              channels: ["FCM", "WHATSAPP"]
            });
          }
        }
      } catch (notifyErr) {
        console.error("[Shipday Webhook] Failed to notify terminal status:", notifyErr);
      }
    } else {
      console.log(`[Shipday Webhook] Status "${mappedStatus}" is logistical. Updated delivery job ${deliveryJob.id} only.`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Shipday Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}
