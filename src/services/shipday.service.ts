import { db } from "@/lib/db";
import { orders, deliveryJobs, users, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createShipdayOrder } from "@/lib/shipday";

export class ShipdayService {
  /**
   * Creates a Shipday order for a given local order ID.
   * If a delivery job already exists for this order, it returns the existing job.
   */
  static async triggerShipdayOrder(
    orderId: string,
    initialStatus: "DISPATCH_REQUESTED" | "OUT_FOR_DELIVERY" = "DISPATCH_REQUESTED"
  ) {
    console.log(`[ShipdayService] triggerShipdayOrder called for ${orderId} with status ${initialStatus}`);
    try {
      // 1. Pre-emptive check
      const [existingJob] = await db
        .select()
        .from(deliveryJobs)
        .where(eq(deliveryJobs.orderId, orderId))
        .limit(1);

      if (existingJob && existingJob.providerOrderId !== "LOCK") {
        console.log(`[ShipdayService] Delivery job already exists for order ${orderId}. Syncing status only.`);
        await db
          .update(deliveryJobs)
          .set({
            status: initialStatus,
            updatedAt: new Date(),
          })
          .where(eq(deliveryJobs.orderId, orderId));

        return {
          ...existingJob,
          status: initialStatus,
          updatedAt: new Date(),
        };
      }

      // 2. Atomic Lock: Try to insert a placeholder record
      // If another request is doing this, the unique constraint on orderId will fail.
      if (!existingJob) {
        try {
          await db.insert(deliveryJobs).values({
            orderId,
            provider: "shipday",
            status: initialStatus,
            providerOrderId: "LOCK", // Temporary lock
            updatedAt: new Date(),
          });
          console.log(`[ShipdayService] Lock acquired for order ${orderId}`);
        } catch {
          console.log(`[ShipdayService] Could not acquire lock for ${orderId} (likely already being processed).`);
          return;
        }
      } else if (existingJob.providerOrderId === "LOCK") {
        // If lock is older than 2 minutes it's stale (process died mid-flight) — delete and retry
        const lockAge = Date.now() - new Date(existingJob.updatedAt).getTime();
        if (lockAge < 2 * 60 * 1000) {
          console.log(`[ShipdayService] Order ${orderId} is being processed by another request. Skipping.`);
          return;
        }
        console.warn(`[ShipdayService] Stale lock detected for ${orderId} (${Math.round(lockAge / 1000)}s old). Removing and retrying.`);
        await db.delete(deliveryJobs).where(eq(deliveryJobs.orderId, orderId));
        // Fall through — the lock insert below will re-acquire
        try {
          await db.insert(deliveryJobs).values({
            orderId,
            provider: "shipday",
            status: initialStatus,
            providerOrderId: "LOCK",
            updatedAt: new Date(),
          });
          console.log(`[ShipdayService] Re-acquired lock for order ${orderId} after stale lock cleanup.`);
        } catch {
          console.log(`[ShipdayService] Could not re-acquire lock for ${orderId}.`);
          return;
        }
      }

      // 2. Fetch full order details using explicit joins for reliability
      const orderRows = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          deliveryFee: orders.deliveryFee,
          deliveryAddress: orders.deliveryAddress,
          deliveryArea: orders.deliveryArea,
          customerPhone: orders.customerPhone,
          userName: users.name,
          userPhone: users.phone,
          restaurantName: restaurants.name,
          restaurantLocation: restaurants.location,
          restaurantPhone: restaurants.contactPhone,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderRows.length === 0) {
        console.error(`[ShipdayService] Order ${orderId} not found in database.`);
        throw new Error(`Order ${orderId} not found.`);
      }

      const orderData = orderRows[0];

      // Use deliveryArea as fallback when deliveryAddress is null
      const resolvedDeliveryAddress = orderData.deliveryAddress || orderData.deliveryArea || null;

      if (!orderData.restaurantName || !resolvedDeliveryAddress) {
        console.error(`[ShipdayService] Missing critical details for order ${orderId}.`, {
          hasRestaurant: !!orderData.restaurantName,
          hasAddress: !!resolvedDeliveryAddress,
        });
        throw new Error(`Order ${orderId} is missing restaurantName or deliveryAddress — cannot send to Shipday.`);
      }

      // Fetch items
      const itemsRows = await db
        .select({
          name: menuItems.name,
          quantity: orderItems.quantity,
          price: orderItems.price,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, orderId));

      if (itemsRows.length === 0) {
        console.warn(`[ShipdayService] No items found for order ${orderId}. Shipday might reject this.`);
      }

      console.log(`[ShipdayService] Preparing payload for Shipday API...`);

      // 3. Create order in Shipday
      const shipdayOrder = await createShipdayOrder({
        orderId: orderData.id,
        customerName: orderData.userName || "Customer",
        customerPhoneNumber: orderData.customerPhone || orderData.userPhone || "0000000000",
        customerAddress: resolvedDeliveryAddress,
        restaurantName: orderData.restaurantName,
        restaurantAddress: orderData.restaurantLocation || orderData.restaurantName,
        restaurantPhoneNumber: orderData.restaurantPhone,
        orderItems: itemsRows.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number.parseFloat(item.price),
        })),
        totalAmount: orderData.totalAmount,
        deliveryFee: orderData.deliveryFee,
      });

      console.log(`[ShipdayService] Shipday API success. ProviderOrderId: ${shipdayOrder.providerOrderId}`);

      // 4. Update the delivery job record (removing the lock)
      const [newJob] = await db
        .update(deliveryJobs)
        .set({
          status: initialStatus,
          providerOrderId: shipdayOrder.providerOrderId,
          trackingId: shipdayOrder.trackingId,
          trackingUrl: shipdayOrder.trackingUrl,
          driverName: shipdayOrder.driverName,
          driverPhone: shipdayOrder.driverPhone,
          eta: shipdayOrder.eta,
          updatedAt: new Date(),
        })
        .where(eq(deliveryJobs.orderId, orderData.id))
        .returning();

      console.log(`[ShipdayService] Successfully updated delivery job for ${orderId}`);
      return newJob;
    } catch (error) {
      console.error(`[ShipdayService] ERROR for order ${orderId}:`, error);
      // Remove the LOCK record so Stripe webhook retries can re-attempt cleanly
      try {
        await db
          .delete(deliveryJobs)
          .where(eq(deliveryJobs.orderId, orderId));
        console.log(`[ShipdayService] Lock cleared for ${orderId} — safe to retry.`);
      } catch (cleanupErr) {
        console.error(`[ShipdayService] Failed to clear lock for ${orderId}:`, cleanupErr);
      }
      throw error;
    }
  }

  /**
   * Syncs the delivery job status if it exists.
   */
  static async updateDeliveryStatus(
    orderId: string,
    status: "DISPATCH_REQUESTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
  ) {
    try {
      const validStatuses = ["DISPATCH_REQUESTED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
      if (!validStatuses.includes(status)) return;

      console.log(`[ShipdayService] Updating delivery job status for ${orderId} to ${status}`);
      await db
        .update(deliveryJobs)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(deliveryJobs.orderId, orderId));
    } catch (error) {
      console.error(`[ShipdayService] Failed to update delivery status for ${orderId}:`, error);
    }
  }
}
