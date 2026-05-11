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
import { eq } from "drizzle-orm";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import {
  buildPaymentConfirmedEmailTemplate,
} from "../templates/email";
import { formatCurrency, resolveEmailBrand } from "../templates/email/utils";

type NotificationMetadata = Record<string, unknown>;

// Gracefully handle if Twilio env vars are not configured
let twilioClient: ReturnType<typeof twilio> | null = null;
try {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  if (twilioAccountSid && twilioAuthToken) {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  }
} catch {
  console.warn("[NotificationService] Twilio package not found. WhatsApp notifications will not be sent.");
}

const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

type OrderEmailData = {
  orderId: string;
  status: string;
  restaurantName: string;
  restaurantLocation: string | null;
  totalAmount: string;
  deliveryFee: string;
  currency: string;
  deliveryAddress: string | null;
  createdAt: Date | null;
  items: Array<{ name: string; quantity: number; price: string }>;
};

async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      deliveryFee: orders.deliveryFee,
      currency: orders.currency,
      deliveryAddress: orders.deliveryAddress,
      createdAt: orders.createdAt,
      restaurantName: restaurants.name,
      restaurantLocation: restaurants.location,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      name: menuItems.name,
      quantity: orderItems.quantity,
      price: orderItems.price,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    orderId: order.id,
    status: order.status,
    restaurantName: order.restaurantName,
    restaurantLocation: order.restaurantLocation,
    totalAmount: order.totalAmount,
    deliveryFee: order.deliveryFee,
    currency: order.currency,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt,
    items,
  };
}

/**
 * notification.service.ts - Handles sending FCM notifications and tracking their status.
 */

export class NotificationService {
  /**
   * Processes a pending notification and sends it via FCM.
   */
  static async sendFCM(notificationId: string) {
    try {
      // 1. Fetch notification and recipient details in a single JOIN
      const [result] = await db
        .select({
          notification: notifications,
          user: {
            fcmToken: users.fcmToken,
            email: users.email
          }
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[NotificationService] Notification or User for ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (notification.channel !== "FCM") {
        console.log(`[NotificationService] Notification ${notificationId} is not for FCM channel.`);
        return;
      }

      if (!user?.fcmToken) {
        console.warn(`[NotificationService] No FCM token found for user ${notification.recipientId}.`);
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      if (!messaging) {
        console.error("[NotificationService] Firebase Messaging is not initialized.");
        return;
      }

      // 3. Send via FCM
      console.log(`[NotificationService] Sending FCM to token: ${user.fcmToken.slice(0, 10)}...`);
      
      let rawMetadata = notification.metadata || {};
      if (typeof rawMetadata === "string") {
        try {
          rawMetadata = JSON.parse(rawMetadata);
        } catch (e) {
          rawMetadata = {};
        }
      }
      
      // FCM requires ALL data values to be strings — stringify everything
      const stringifiedMetadata: Record<string, string> = {};
      for (const [key, val] of Object.entries(rawMetadata)) {
        if (val !== null && val !== undefined) {
          stringifiedMetadata[key] = String(val);
        }
      }

      // Use the actual order status from metadata so clients update correctly.
      // e.g. payment notification → PAID, new order notification → PENDING_CONFIRMATION
      const orderStatus = stringifiedMetadata.orderStatus || "PENDING_CONFIRMATION";
      console.log(`[NotificationService] Preparing FCM for ${user.email}. Status: ${orderStatus}, Type: ${notification.type}, Metadata:`, stringifiedMetadata);

      const message = {
        token: user.fcmToken,
        data: {
          title: notification.subject,
          body: notification.body,
          type: notification.type,  // "ORDER"
          status: orderStatus,       // actual status from metadata
          ...stringifiedMetadata,    // orderId, orderStatus, etc. — all strings
        },
      };

      await messaging.send(message);

      // 4. Update status to SENT
      await db
        .update(notifications)
        .set({ status: "SENT" })
        .where(eq(notifications.id, notificationId));

      console.log(`[NotificationService] FCM sent successfully for notification ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending FCM for ${notificationId}:`, error);
      
      // Update status to FAILED
      await db
        .update(notifications)
        .set({ status: "FAILED" })
        .where(eq(notifications.id, notificationId));
    }
  }

  /**
   * Processes a pending notification and sends it via WhatsApp.
   */
  static async sendWhatsApp(notificationId: string) {
    try {
      const [result] = await db
        .select({
          notification: notifications,
          user: {
            phone: users.phone
          }
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[NotificationService] Notification or User for ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (notification.channel !== "WHATSAPP") {
        console.log(`[NotificationService] Notification ${notificationId} is not for WHATSAPP channel.`);
        return;
      }

      if (!user?.phone) {
        console.warn(`[NotificationService] No phone number found for user ${notification.recipientId}. WhatsApp skipped.`);
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      // Normalize phone: remove non-digits, ensure + prefix.
      const cleaned = user.phone.replace(/\D/g, "");
      const toPhone = user.phone.startsWith("+") ? `+${cleaned}` : `+${cleaned}`;

      if (!twilioClient || !twilioWhatsAppNumber) {
        console.error("[NotificationService] Twilio is not configured properly (missing client or number env vars).");
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      const messageBody = `*${notification.subject}*\n\n${notification.body}`;
      console.log(`[NotificationService] Sending WhatsApp to ${toPhone}. Body:\n${messageBody}`);

      await twilioClient.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${toPhone}`,
        body: messageBody,
      });

      await db
        .update(notifications)
        .set({ status: "SENT" })
        .where(eq(notifications.id, notificationId));

      console.log(`[NotificationService] WhatsApp sent successfully for notification ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending WhatsApp for ${notificationId}:`, error);
      
      await db
        .update(notifications)
        .set({ status: "FAILED" })
        .where(eq(notifications.id, notificationId));
    }
  }

  /**
   * Processes a pending notification and sends it via SendGrid Email.
   */
  static async sendEmail(notificationId: string) {
    try {
      const [result] = await db
        .select({
          notification: notifications,
          user: {
            email: users.email
          }
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[NotificationService] Notification or User for ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (notification.channel !== "EMAIL") {
        console.log(`[NotificationService] Notification ${notificationId} is not for EMAIL channel.`);
        return;
      }

      if (!user?.email) {
        console.warn(`[NotificationService] No email found for user ${notification.recipientId}. EMAIL skipped.`);
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      const fromEmail = process.env.SENDGRID_FROM_EMAIL;
      if (!fromEmail) {
        console.error("[NotificationService] SENDGRID_FROM_EMAIL is not configured.");
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      console.log(`[NotificationService] Sending Email to ${user.email}. Subject: ${notification.subject}`);

      const metadata = (notification.metadata as NotificationMetadata | null) ?? null;
      const orderId = typeof metadata?.orderId === "string" ? metadata.orderId : null;
      const orderEmailData = notification.type === "ORDER" && orderId
        ? await getOrderEmailData(orderId)
        : null;

      const templateId = process.env.SENDGRID_PAYMENT_TEMPLATE_ID;
      let msg: any;

      if (templateId && orderEmailData && orderEmailData.status === "PAID") {
        const brand = resolveEmailBrand(orderEmailData.restaurantLocation);
        // 1. Sanitize the template ID (prevent env-var concatenation bugs)
        const cleanTemplateId = templateId.split(/[\s\n\r=]/)[0].trim();
        msg = {
          to: user.email,
          from: fromEmail,
          templateId: cleanTemplateId,
          dynamicTemplateData: {
            brandName: brand.siteName,
            brandPrimary: brand.primary,
            brandAccent: brand.accent,
            brandNotice: brand.notice,
            supportEmail: brand.supportEmail,
            orderId: orderEmailData.orderId.slice(0, 8).toUpperCase(),
            restaurantName: orderEmailData.restaurantName,
            items: orderEmailData.items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: formatCurrency(i.price, orderEmailData.currency),
            })),
            totalAmount: formatCurrency(orderEmailData.totalAmount, orderEmailData.currency),
            deliveryFee: formatCurrency(orderEmailData.deliveryFee, orderEmailData.currency),
          },
        };
      } else {
        const html = orderEmailData
          ? orderEmailData.status === "PAID"
            ? buildPaymentConfirmedEmailTemplate(notification.subject, notification.body, orderEmailData)
            : notification.body.replace(/\n/g, "<br/>")
          : notification.body.replace(/\n/g, "<br/>");

        msg = {
          to: user.email,
          from: fromEmail,
          subject: notification.subject,
          text: notification.body,
          html,
        };
      }

      const [response] = await sgMail.send(msg);
      console.log(`[NotificationService] SendGrid response: ${response.statusCode}`);

      await db
        .update(notifications)
        .set({ status: "SENT" })
        .where(eq(notifications.id, notificationId));

      console.log(`[NotificationService] Email sent successfully for notification ${notificationId}`);
    } catch (error: any) {
      console.error(`[NotificationService] Error sending Email for ${notificationId}:`, error);
      if (error.response?.body) {
        console.error("[NotificationService] SendGrid Error Details:", JSON.stringify(error.response.body, null, 2));
      }
      
      await db
        .update(notifications)
        .set({ status: "FAILED" })
        .where(eq(notifications.id, notificationId));
    }
  }

  /**
   * Central helper to dispatch notifications across multiple channels.
   * Ensures consistency and reduces boilerplate in API routes.
   */
  static async dispatchOrderNotifications(params: {
    userId: string;
    type: (typeof notificationTypeEnum)[number];
    subject: string;
    body: string;
    metadata?: NotificationMetadata;
    channels?: (typeof notificationChannelEnum)[number][];
  }) {
    const { userId, type, subject, body, metadata, channels = ["FCM", "WHATSAPP"] } = params;

    console.log(`[NotificationService] Dispatching ${channels.length} notifications to user ${userId} (Type: ${type})`);

    try {
      const insertedNotifications = await db.insert(notifications).values(
        channels.map((channel) => ({
          recipientId: userId,
          type,
          subject,
          body,
          channel,
          status: "PENDING" as const,
          metadata,
        }))
      ).returning({ id: notifications.id });

      insertedNotifications.forEach((notif) => {
        // Critical Bug 3: Trigger notifications in the background to avoid blocking the main request
        this.trigger(notif.id).catch(err => 
          console.error(`[NotificationService] Failed to trigger notification ${notif.id}:`, err)
        );
      });

      return insertedNotifications.map((notif) => notif.id);
    } catch (err) {
      console.error("[NotificationService] Failed to insert notifications:", err);
      return [];
    }
  }

  /**
   * Helper to trigger a new notification send.
   * Can be called after inserting a notification row.
   */
  static async trigger(notificationId: string) {
    try {
      const [notif] = await db
        .select({ channel: notifications.channel })
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notif) {
        console.warn(`[NotificationService] Trigger failed: Notification ${notificationId} not found.`);
        return;
      }

      console.log(`[NotificationService] Triggering channel ${notif.channel} for notification ${notificationId}`);

      if (notif.channel === "FCM") {
        await this.sendFCM(notificationId);
      } else if (notif.channel === "WHATSAPP") {
        await this.sendWhatsApp(notificationId);
      } else if (notif.channel === "EMAIL") {
        await this.sendEmail(notificationId);
      }
    } catch (err) {
      console.error("[NotificationService] Trigger failed:", err);
    }
  }
}
