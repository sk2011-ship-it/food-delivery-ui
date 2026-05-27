import { db } from "@/lib/db";
import { orders, deliveryJobs, users, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createShipdayOrder, listShipdayCarriers, assignShipdayCarrierToOrder, markShipdayOrderAsReady } from "@/lib/shipday";

// ── Haversine distance (km) between two lat/lng points ──────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
      // 1. Check for existing delivery job
      const [existingJob] = await db
        .select()
        .from(deliveryJobs)
        .where(eq(deliveryJobs.orderId, orderId))
        .limit(1);

      // Guard A: Already has a real Shipday order ID → just sync status, nothing more to do
      if (
        existingJob &&
        existingJob.providerOrderId !== "LOCK" &&
        existingJob.providerOrderId !== null &&
        existingJob.providerOrderId !== "null"
      ) {
        console.log(`[ShipdayService] Already created for ${orderId} (providerOrderId: ${existingJob.providerOrderId}). Syncing status only.`);
        await db
          .update(deliveryJobs)
          .set({ status: initialStatus, updatedAt: new Date() })
          .where(eq(deliveryJobs.orderId, orderId));
        return { ...existingJob, status: initialStatus, updatedAt: new Date() };
      }

      // Guard B: Active fresh lock → another request is already processing this order
      if (existingJob?.providerOrderId === "LOCK") {
        const lockAge = Date.now() - new Date(existingJob.updatedAt).getTime();
        if (lockAge < 2 * 60 * 1000) {
          console.log(`[ShipdayService] Order ${orderId} is locked by another request (${Math.round(lockAge / 1000)}s ago). Skipping.`);
          return;
        }
        // Stale lock (process died mid-flight) — clean up and fall through to re-acquire
        console.warn(`[ShipdayService] Stale lock (${Math.round(lockAge / 1000)}s) for ${orderId}. Removing.`);
        await db.delete(deliveryJobs).where(eq(deliveryJobs.orderId, orderId));
      }

      // Guard C: Failed previous attempt — providerOrderId is null (real NULL or string "null")
      // NOTE: Must check existingJob again since Guard B may have already deleted it
      if (existingJob && existingJob.providerOrderId !== "LOCK") {
        // At this point providerOrderId is null/"null" (Guards A+B ruled out other cases)
        console.warn(`[ShipdayService] Null providerOrderId for ${orderId} — deleting stale record and retrying.`);
        await db.delete(deliveryJobs).where(eq(deliveryJobs.orderId, orderId)).catch(() => { });
        // Fall through — insert the LOCK below
      }

      // 2. Acquire lock — all paths that reach here need a fresh LOCK record.
      // The unique constraint on orderId makes this atomic: only one request wins.
      try {
        await db.insert(deliveryJobs).values({
          orderId,
          provider: "shipday",
          status: initialStatus,
          providerOrderId: "LOCK",
          updatedAt: new Date(),
        });
        console.log(`[ShipdayService] Lock acquired for order ${orderId}`);
      } catch {
        console.log(`[ShipdayService] Could not acquire lock for ${orderId} (race condition — another request got there first).`);
        return;
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
          restaurantLat: restaurants.latitude,
          restaurantLng: restaurants.longitude,
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

      // 4. Verification Flow (Step 2): Ensure no customer name leaked during creation
      // We explicitly set null to clear anything Shipday might have echoed.
      const [newJob] = await db
        .update(deliveryJobs)
        .set({
          status: initialStatus,
          providerOrderId: shipdayOrder.providerOrderId,
          trackingId: shipdayOrder.trackingId,
          trackingUrl: shipdayOrder.trackingUrl,
          driverName: null,
          driverPhone: null,
          eta: null,
          updatedAt: new Date(),
        })
        .where(eq(deliveryJobs.orderId, orderData.id))
        .returning();

      console.log(`[ShipdayService] Delivery job initialized for ${orderId}. Searching for drivers...`);

      // 5. Probe Shipday (Step 3): Assign closest driver immediately
      if (shipdayOrder.providerOrderId) {
        void this.autoAssignClosestDriver(
          shipdayOrder.providerOrderId,
          orderData.restaurantLat ? Number(orderData.restaurantLat) : null,
          orderData.restaurantLng ? Number(orderData.restaurantLng) : null
        );
      }

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
   * Finds the closest available (on-shift) Shipday carrier to the restaurant
   * and assigns them to the given Shipday order.
   *
   * - If carriers have real-time GPS location, picks the nearest one.
   * - If no GPS data is available, falls back to the first on-shift carrier.
   * - If no carriers are on shift, logs a warning and returns null;
   *   the webhook handler will retry when a driver next comes on shift.
   */
  static async autoAssignClosestDriver(
    providerOrderId: string,
    restaurantLat?: number | null,
    restaurantLng?: number | null
  ): Promise<{ carrierId: number; name: string } | null> {
    try {
      const carriers = await listShipdayCarriers();
      const available = carriers.filter((c) => c.isOnShift && c.isActive !== false);

      if (available.length === 0) {
        console.warn(
          `[ShipdayService] No on-shift carriers available for order ${providerOrderId}. ` +
          `Will retry when next driver comes on shift.`
        );
        return null;
      }

      let chosen = available[0];

      // If the restaurant has coordinates AND some carriers expose GPS, pick closest
      if (restaurantLat != null && restaurantLng != null) {
        const withGps = available.filter((c) => c.lastLocation != null);
        if (withGps.length > 0) {
          chosen = withGps.reduce((best, c) => {
            const distBest = haversineKm(
              restaurantLat, restaurantLng,
              best.lastLocation!.lat, best.lastLocation!.lng
            );
            const distC = haversineKm(
              restaurantLat, restaurantLng,
              c.lastLocation!.lat, c.lastLocation!.lng
            );
            return distC < distBest ? c : best;
          });
        }
      }

      // 1. Assign and Link Carrier (using reliable PUT)
      await assignShipdayCarrierToOrder(providerOrderId, chosen.carrierId);

      // 2. Broadcast to Mobile (Ready + Start)
      // We do this in the background so it never blocks the primary assignment flow
      void (async () => {
        try {
          const { markShipdayOrderAsReady, startShipdayOrder } = await import("@/lib/shipday");
          // Set to READY so it shows up as a pickup task
          await markShipdayOrderAsReady(providerOrderId).catch(() => { });
          // Set to STARTED to force acceptance and push notification
          await startShipdayOrder(providerOrderId).catch(() => { });
        } catch (e) {
          console.warn(`[ShipdayService] Non-critical: Mobile broadcast failed:`, e);
        }
      })();

      console.log(
        `[ShipdayService] Auto-assigned carrier ${chosen.carrierId} (${chosen.name}) ` +
        `to Shipday order ${providerOrderId}. Verifying...`
      );

      // Verification (Step 5): Update the DB to reflect the new assignment
      await db
        .update(deliveryJobs)
        .set({
          driverName: chosen.name,
          driverPhone: chosen.phoneNumber,
          updatedAt: new Date(),
        })
        .where(eq(deliveryJobs.providerOrderId, providerOrderId));

      return { carrierId: chosen.carrierId, name: chosen.name };
    } catch (err) {
      console.error(
        `[ShipdayService] autoAssignClosestDriver failed for ${providerOrderId}:`, err
      );
      return null;
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
