import { messaging } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import {
  notifications,
  users,
  orders,
  orderItems,
  menuItems,
  restaurants,
  type notificationTypeEnum,
  type notificationChannelEnum,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import twilio from "twilio";
import { TEMPLATE_SIDS } from "@/config/whatsapp-templates";

type NotificationMetadata = Record<string, unknown>;

let twilioClient: ReturnType<typeof twilio> | null = null;
try {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) twilioClient = twilio(sid, token);
} catch {
  console.warn("[NotificationService] Twilio not available.");
}

const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kilkeeleats.com";

// ─── DB helper: fetch full order context needed for WhatsApp variables ────────

async function fetchOrderContext(orderId: string) {
  const [orderRow] = await db
    .select({
      id:              orders.id,
      totalAmount:     orders.totalAmount,
      deliveryFee:     orders.deliveryFee,
      serviceCharge:   orders.serviceCharge,
      deliveryAddress: orders.deliveryAddress,
      deliveryArea:    orders.deliveryArea,
      restaurantId:    orders.restaurantId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) return null;

  const [restaurantRow, itemRows] = await Promise.all([
    db
      .select({ name: restaurants.name, location: restaurants.location })
      .from(restaurants)
      .where(eq(restaurants.id, orderRow.restaurantId))
      .limit(1)
      .then((r) => r[0] ?? null),

    db
      .select({ name: menuItems.name, quantity: orderItems.quantity, price: orderItems.price })
      .from(orderItems)
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, orderId)),
  ]);

  const total        = parseFloat(orderRow.totalAmount  ?? "0");
  const delivery     = parseFloat(orderRow.deliveryFee  ?? "0");
  const service      = parseFloat(orderRow.serviceCharge ?? "0");
  const subtotal     = (total - delivery - service).toFixed(2);

  const itemsFormatted = itemRows
    .map((i) => `${i.name} x${i.quantity} — £${parseFloat(i.price).toFixed(2)}`)
    .join("\n");

  const deliveryLabel = [orderRow.deliveryAddress, orderRow.deliveryArea]
    .filter(Boolean)
    .join(", ");

  return {
    orderId8:        orderId.slice(0, 8).toUpperCase(),
    orderIdFull:     orderId,
    totalAmount:     total.toFixed(2),
    deliveryFee:     delivery.toFixed(2),
    serviceCharge:   service.toFixed(2),
    subtotal,
    deliveryAddress: deliveryLabel || "—",
    restaurantName:  restaurantRow?.name  ?? "the restaurant",
    location:        restaurantRow?.location ?? "",
    itemsFormatted:  itemsFormatted || "—",
  };
}

// ─── FCM ──────────────────────────────────────────────────────────────────────

export class NotificationService {
  static async sendFCM(notificationId: string) {
    try {
      const [result] = await db
        .select({
          notification: notifications,
          user: { fcmToken: users.fcmToken, email: users.email },
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[FCM] Notification ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (!user?.fcmToken) {
        await db.update(notifications).set({ status: "FAILED" }).where(eq(notifications.id, notificationId));
        return;
      }
      if (!messaging) {
        console.error("[FCM] Firebase Messaging not initialised.");
        return;
      }

      let raw = notification.metadata || {};
      if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { raw = {}; } }
      const meta = raw as Record<string, string>;

      const stringified: Record<string, string> = {};
      for (const [k, v] of Object.entries(meta)) {
        if (v !== null && v !== undefined) stringified[k] = String(v);
      }

      await messaging.send({
        token: user.fcmToken,
        data: {
          title:  notification.subject,
          body:   notification.body,
          type:   notification.type,
          status: stringified.orderStatus ?? "PENDING_CONFIRMATION",
          ...stringified,
        },
      });

      await db.update(notifications).set({ status: "SENT" }).where(eq(notifications.id, notificationId));
      console.log(`[FCM] Sent ${notificationId}`);
    } catch (err) {
      console.error(`[FCM] Error ${notificationId}:`, err);
      await db.update(notifications).set({ status: "FAILED" }).where(eq(notifications.id, notificationId));
    }
  }

  // ─── WhatsApp ───────────────────────────────────────────────────────────────

  static async sendWhatsApp(notificationId: string) {
    try {
      const [result] = await db
        .select({
          notification: notifications,
          user: { phone: users.phone, name: users.name },
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[WhatsApp] Notification ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (!user?.phone) {
        console.warn(`[WhatsApp] No phone for ${notification.recipientId}.`);
        await db.update(notifications).set({ status: "FAILED" }).where(eq(notifications.id, notificationId));
        return;
      }
      if (!twilioClient || !twilioWhatsAppNumber) {
        console.error("[WhatsApp] Twilio not configured.");
        await db.update(notifications).set({ status: "FAILED" }).where(eq(notifications.id, notificationId));
        return;
      }

      const toPhone = `+${user.phone.replace(/\D/g, "")}`;

      const raw  = (notification.metadata ?? {}) as Record<string, string>;
      const role   = raw.targetRole        ?? "";
      const status = raw.orderStatus       ?? "";
      const orderId = raw.orderId          ?? "";
      const reason  = raw.cancellationReason ?? "";

      // Fetch full order context if we have an orderId
      const ctx = orderId ? await fetchOrderContext(orderId) : null;

      const customerName = user.name ?? "there";

      // ── Determine template + variables ──────────────────────────────────────

      let contentSid: string;
      let contentVariables: Record<string, string>;

      if (role === "owner" && status === "PENDING_CONFIRMATION") {
        // Template 1: Owner — new order with Accept/Decline buttons
        contentSid = TEMPLATE_SIDS.kilkeel_owner_new_order;
        contentVariables = {
          "1": ctx?.orderId8        ?? orderId.slice(0, 8).toUpperCase(),
          "2": customerName,
          "3": ctx?.deliveryAddress ?? "—",
          "4": ctx?.itemsFormatted  ?? "—",
          "5": ctx?.subtotal        ?? "0.00",
          "6": ctx?.deliveryFee     ?? "0.00",
          "7": ctx?.serviceCharge   ?? "0.00",
          "8": ctx?.totalAmount     ?? "0.00",
          "9": ctx?.location        ?? "Your Local Eats",
        };

      } else if (role === "customer" && status === "PENDING_CONFIRMATION") {
        // Template 2: Customer — order placed confirmation
        contentSid = TEMPLATE_SIDS.kilkeel_customer_order_received;
        contentVariables = {
          "1": customerName,
          "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
          "3": ctx?.restaurantName ?? "the restaurant",
          "4": ctx?.location       ?? "Your Local Eats",
        };

      } else if (role === "customer" && status === "CONFIRMED") {
        // Template 3: Customer — pay now (5-min window)
        contentSid = TEMPLATE_SIDS.kilkeel_customer_pay_now;
        contentVariables = {
          "1": customerName,
          "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
          "3": ctx?.restaurantName ?? "the restaurant",
          "4": ctx?.location       ?? "Your Local Eats",
          "5": ctx?.totalAmount    ?? "0.00",
          "6": orderId,             // full UUID for the Pay Now URL
        };

      } else if (role === "owner" && status === "PAID") {
        // Template 5: Owner — payment received, wait 2 min then start kitchen
        contentSid = TEMPLATE_SIDS.kilkeel_owner_payment_received;
        contentVariables = {
          "1": ctx?.orderId8        ?? orderId.slice(0, 8).toUpperCase(),
          "2": customerName,
          "3": ctx?.deliveryAddress ?? "—",
          "4": ctx?.itemsFormatted  ?? "—",
          "5": ctx?.totalAmount     ?? "0.00",
        };

      } else if (role === "customer" && status === "PAID") {
        // Template 6: Customer — payment confirmed, 2-min grace window
        contentSid = TEMPLATE_SIDS.kilkeel_customer_payment_confirmed;
        contentVariables = {
          "1": customerName,
          "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
          "3": ctx?.restaurantName ?? "the restaurant",
          "4": ctx?.totalAmount    ?? "0.00",
        };

      } else if (role === "customer" && status === "PREPARING") {
        // Template 7: Customer — food being prepared
        contentSid = TEMPLATE_SIDS.kilkeel_customer_preparing;
        contentVariables = {
          "1": customerName,
          "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
          "3": ctx?.restaurantName ?? "the restaurant",
          "4": ctx?.location       ?? "Your Local Eats",
        };

      } else if (role === "customer" && status === "OUT_FOR_DELIVERY") {
        // Template 8: Customer — out for delivery
        contentSid = TEMPLATE_SIDS.kilkeel_customer_out_for_delivery;
        contentVariables = {
          "1": customerName,
          "2": ctx?.orderId8        ?? orderId.slice(0, 8).toUpperCase(),
          "3": ctx?.restaurantName  ?? "the restaurant",
          "4": ctx?.location        ?? "Your Local Eats",
          "5": ctx?.deliveryAddress ?? "—",
        };

      } else if (role === "customer" && status === "DELIVERED") {
        // Template 9: Customer — delivered
        contentSid = TEMPLATE_SIDS.kilkeel_customer_delivered;
        contentVariables = {
          "1": customerName,
          "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
          "3": ctx?.restaurantName ?? "the restaurant",
        };

      } else if (role === "customer" && status === "CANCELLED") {
        // Templates 4 or 10: declined by restaurant vs other cancellation
        const isDeclined = reason.toLowerCase().includes("declin") || reason.toLowerCase().includes("reject");
        if (isDeclined) {
          contentSid = TEMPLATE_SIDS.kilkeel_customer_order_declined;
          contentVariables = {
            "1": customerName,
            "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
            "3": ctx?.restaurantName ?? "the restaurant",
            "4": ctx?.location       ?? "Your Local Eats",
          };
        } else {
          contentSid = TEMPLATE_SIDS.kilkeel_customer_cancelled;
          contentVariables = {
            "1": customerName,
            "2": ctx?.orderId8       ?? orderId.slice(0, 8).toUpperCase(),
            "3": ctx?.restaurantName ?? "the restaurant",
            "4": ctx?.location       ?? "Your Local Eats",
            "5": reason || "Order was cancelled",
          };
        }

      } else if (role === "owner" && status === "CANCELLED") {
        // Template 11: Owner — order cancelled
        contentSid = TEMPLATE_SIDS.kilkeel_owner_cancelled;
        contentVariables = {
          "1": ctx?.orderId8 ?? orderId.slice(0, 8).toUpperCase(),
          "2": reason        || "Order was cancelled",
        };

      } else {
        // No matching template for this combination — skip silently
        console.warn(`[WhatsApp] No template for role=${role} status=${status}. Skipping.`);
        await db.update(notifications).set({ status: "FAILED" }).where(eq(notifications.id, notificationId));
        return;
      }

      console.log(`[WhatsApp] → ${toPhone} | template: ${contentSid} | role: ${role} | status: ${status}`);

      await twilioClient.messages.create({
        from:             `whatsapp:${twilioWhatsAppNumber}`,
        to:               `whatsapp:${toPhone}`,
        contentSid,
        contentVariables: JSON.stringify(contentVariables),
      } as any);

      await db.update(notifications).set({ status: "SENT" }).where(eq(notifications.id, notificationId));
      console.log(`[WhatsApp] Sent ${notificationId}`);
    } catch (err) {
      console.error(`[WhatsApp] Error ${notificationId}:`, err);
      await db.update(notifications).set({ status: "FAILED" }).where(eq(notifications.id, notificationId));
    }
  }

  // ─── Central dispatcher ─────────────────────────────────────────────────────

  static async dispatchOrderNotifications(params: {
    userId:    string;
    type:      (typeof notificationTypeEnum)[number];
    subject:   string;
    body:      string;
    metadata?: NotificationMetadata;
    channels?: (typeof notificationChannelEnum)[number][];
  }) {
    const { userId, type, subject, body, metadata, channels = ["FCM", "WHATSAPP"] } = params;

    const allowed = channels.filter((c) => c === "FCM" || c === "WHATSAPP");
    if (!allowed.length) return [];

    console.log(`[NotificationService] Dispatching [${allowed.join(", ")}] to user ${userId}`);

    try {
      const inserted = await db
        .insert(notifications)
        .values(
          allowed.map((channel) => ({
            recipientId: userId,
            type,
            subject,
            body,
            channel,
            status: "PENDING" as const,
            metadata,
          }))
        )
        .returning({ id: notifications.id });

      inserted.forEach((notif) => {
        this.trigger(notif.id).catch((err) =>
          console.error(`[NotificationService] Failed to trigger ${notif.id}:`, err)
        );
      });

      return inserted.map((n) => n.id);
    } catch (err) {
      console.error("[NotificationService] Failed to insert notifications:", err);
      return [];
    }
  }

  // ─── Router ─────────────────────────────────────────────────────────────────

  static async trigger(notificationId: string) {
    try {
      const [notif] = await db
        .select({ channel: notifications.channel })
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notif) {
        console.warn(`[NotificationService] ${notificationId} not found.`);
        return;
      }

      if (notif.channel === "FCM")      await this.sendFCM(notificationId);
      else if (notif.channel === "WHATSAPP") await this.sendWhatsApp(notificationId);
    } catch (err) {
      console.error("[NotificationService] Trigger failed:", err);
    }
  }
}
