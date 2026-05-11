import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, cartItems, menuItems, restaurants, orderSessions, deliveryJobs } from "@/lib/db/schema";
import { eq, inArray, desc, sql, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";
import { SITES, DEFAULT_SITE } from "@/config/sites";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { cancelExpiredPendingOrders } from "@/lib/order-expiration";
import { normalizePhone, phoneDigits } from "@/lib/phone";
import { calculateDeliveryFee } from "@/lib/delivery";

function getSiteFromLocation(location: string | null) {
  if (!location) return SITES[DEFAULT_SITE];
  const normalized = location.trim().toLowerCase();
  const match = Object.values(SITES).find(
    (s) => s.location.trim().toLowerCase() === normalized
  );
  return match ?? SITES[DEFAULT_SITE];
}

export const dynamic = "force-dynamic";

function normalizeLocation(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * POST /api/orders
 * Creates one or more orders from the current user's cart.
 */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const {
        deliveryAddress,
        deliveryArea,
        deliveryFee,
        distanceMiles,
        customerPhone,
        siteLocation,
        deliveryFeesBreakdown // New field from frontend: { [restaurantId]: fee }
      } = await req.json().catch(() => ({}));

      const normalizedPhone = normalizePhone(customerPhone);
      if (phoneDigits(normalizedPhone).length < 10) {
        return fail("Contact number must contain at least 10 digits.", 400);
      }
      const activeSiteLocation = normalizeLocation(siteLocation);
      if (!activeSiteLocation) {
        return fail("Site location is required.", 400);
      }

      // Validate or fallback for deliveryFeesBreakdown
      const fees = deliveryFeesBreakdown || {};

      // CRITICAL-4: Recalculate and validate delivery fee server-side
      const siteConfig = getSiteFromLocation(activeSiteLocation);
      if (siteConfig.deliveryPricing?.type === "fixed_areas") {
        const expectedFee = calculateDeliveryFee(siteConfig, { area: deliveryArea });
        if (Math.abs(expectedFee - (deliveryFee || 0)) > 0.01) {
          return fail(`Invalid delivery fee for area: ${deliveryArea}. Expected £${expectedFee.toFixed(2)}`, 400);
        }
      }
      /**
       * NOTE: distance_slabs sites require restaurant coordinates stored in DB to fully validate 
       * distance-based fees server-side. Currently, we rely on client-sent distance for those.
       */

      const createdOrders = await db.transaction(async (tx) => {
        const cartRows = await tx
          .select({
            cartItemId: cartItems.id,
            menuItemId: cartItems.menuItemId,
            quantity: cartItems.quantity,
            price: menuItems.price,
            restaurantId: menuItems.restaurantId,
            restaurantName: restaurants.name,
            restaurantLocation: restaurants.location,
            openingHours: restaurants.openingHours,
          })
          .from(cartItems)
          .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
          .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
          .where(eq(cartItems.userId, user.id));

        if (cartRows.length === 0) {
          throw new Error("CART_EMPTY");
        }

        const siteItems = cartRows.filter(
          (row) => normalizeLocation(row.restaurantLocation) === activeSiteLocation
        );
        const skippedItems = cartRows.filter(
          (row) => normalizeLocation(row.restaurantLocation) !== activeSiteLocation
        );

        const openItems = siteItems.filter((row) => isRestaurantOpen(row.openingHours));
        const closedItems = siteItems.filter((row) => !isRestaurantOpen(row.openingHours));

        if (openItems.length === 0) {
          throw new Error(
            `ALL_RESTAURANTS_CLOSED:${[...closedItems, ...skippedItems].map((item) => item.restaurantName).join(", ")}`
          );
        }

        await tx
          .delete(cartItems)
          .where(inArray(cartItems.id, openItems.map((item) => item.cartItemId)));

        const userCartItems = openItems.map((item) => ({
          cartItemId: item.cartItemId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          restaurantId: item.restaurantId,
        }));

        // 1. Group by restaurant as before
        const itemsByRestaurant: Record<string, typeof userCartItems> = {};
        userCartItems.forEach((item) => {
          if (!itemsByRestaurant[item.restaurantId]) {
            itemsByRestaurant[item.restaurantId] = [];
          }
          itemsByRestaurant[item.restaurantId].push(item);
        });

        // 2. Create the parent Session
        const [session] = await tx.insert(orderSessions).values({
          userId: user.id,
          status: "PENDING",
          totalItemsAmount: "0.00", // Will update or calculate
          totalDeliveryFee: deliveryFee ? deliveryFee.toFixed(2) : "0.00",
          totalServiceCharge: "0.00", // Will update
          deliveryAddress,
          deliveryArea,
          distanceMiles: distanceMiles ? distanceMiles.toFixed(4) : null,
          customerPhone: normalizedPhone,
        }).returning();

        // 3. Fetch restaurants to get financial settings
        const restaurantIds = Object.keys(itemsByRestaurant);
        const restaurantsData = await tx.select({
          id: restaurants.id,
          name: restaurants.name,
          location: restaurants.location,
          openingHours: restaurants.openingHours,
        }).from(restaurants).where(inArray(restaurants.id, restaurantIds));

        const restaurantLookup = new Map(restaurantsData.map(r => [r.id, r]));

        const ordersList = [];
        let sessionTotalItems = 0;
        let sessionTotalServiceCharge = 0;

        for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
          const restaurant = restaurantLookup.get(restaurantId);
          if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");

          // 3.5 Validate Restaurant Operational Hours
          if (!isRestaurantOpen(restaurant.openingHours)) {
            throw new Error(`RESTAURANT_CLOSED:${restaurant.name}`);
          }

          const site = getSiteFromLocation(restaurant.location);
          const serviceCharge = site.serviceCharge ?? 0;
          sessionTotalServiceCharge += serviceCharge;

          const itemTotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price as string) * item.quantity);
          }, 0);


          const finalTotalAmount = itemTotal;

          sessionTotalItems += itemTotal;

          // If breakdown exists, use it. Otherwise split evenly (Option B fallback)
          const restaurantFee = fees[restaurantId]
            || (deliveryFee / Object.keys(itemsByRestaurant).length);

          const [newOrder] = await tx.insert(orders).values({
            userId: user.id,
            restaurantId,
            sessionId: session.id,
            totalAmount: finalTotalAmount.toFixed(2),
            deliveryFee: restaurantFee.toFixed(2),
            serviceCharge: serviceCharge.toFixed(2),
            deliveryAddress,
            deliveryArea,
            distanceMiles: distanceMiles ? (distanceMiles / Object.keys(itemsByRestaurant).length).toFixed(4) : null,
            customerPhone: normalizedPhone,
            status: "PENDING_CONFIRMATION",
            isSettled: "NO",
            restaurantNameSnapshot: restaurant.name,
          }).returning();

          await tx.insert(orderItems).values(
            items.map(item => ({
              orderId: newOrder.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: (parseFloat(item.price as string)).toFixed(2),
            }))
          );

          ordersList.push(newOrder);
        }

        // Update session with correct item total and service charge
        await tx.update(orderSessions)
          .set({ 
            totalItemsAmount: sessionTotalItems.toFixed(2),
            totalServiceCharge: sessionTotalServiceCharge.toFixed(2)
          })
          .where(eq(orderSessions.id, session.id));

        return {
          orders: ordersList,
          sessionId: session.id,
          closedItems: closedItems.map((item) => item.restaurantName),
          skippedItems: skippedItems.map((item) => item.restaurantName),
        };
      });

      // --- Notification Logic (Background) ---
      // Security Bug 2: Use waitUntil to ensure background tasks finish in serverless
      const notificationTask = (async () => {
        try {
          await Promise.all(
            createdOrders.orders.map(async (newOrder) => {
              const [[restaurant], itemsRows] = await Promise.all([
                db
                  .select({ ownerId: restaurants.ownerId, name: restaurants.name })
                  .from(restaurants)
                  .where(eq(restaurants.id, newOrder.restaurantId))
                  .limit(1),
                db
                  .select({
                    name: menuItems.name,
                    quantity: orderItems.quantity,
                    price: orderItems.price,
                  })
                  .from(orderItems)
                  .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
                  .where(eq(orderItems.orderId, newOrder.id)),
              ]);

              if (restaurant) {
                const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
                const totalAmount = newOrder.totalAmount;

                const ownerBody = `New Order Received!\n\nOrder #${newOrder.id.slice(0, 8)}\nItems:\n${itemsSummary}\n\nTotal: £${totalAmount}\n\nAddress: ${newOrder.deliveryAddress}`;
                const customerBody = `Your order #${newOrder.id.slice(0, 8)} from ${restaurant.name} has been received. We'll notify you when it's confirmed!`;

                // Dispatch Owner Notification immediately
                if (restaurant.ownerId) {
                  await NotificationService.dispatchOrderNotifications({
                    userId: restaurant.ownerId,
                    type: "ORDER",
                    subject: "New Order Received!",
                    body: ownerBody,
                    metadata: { orderId: newOrder.id, orderStatus: "PENDING_CONFIRMATION", targetRole: "owner" },
                    channels: ["FCM", "WHATSAPP"]
                  });
                }

                // Add a small delay for customer notification to ensure DB commit is visible 
                // when the frontend tries to fetch the order by ID immediately after FCM.
                if (newOrder.userId) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  await NotificationService.dispatchOrderNotifications({
                    userId: newOrder.userId,
                    type: "ORDER",
                    subject: "Order Received! 🛍️",
                    body: customerBody,
                    metadata: { orderId: newOrder.id, orderStatus: "PENDING_CONFIRMATION", targetRole: "customer" },
                    channels: ["FCM", "WHATSAPP"]
                  });
                }
              }
            })
          );
        } catch (notifyErr) {
          console.error("[api/orders POST] Background notification error:", notifyErr);
        }
      })();

      // Use waitUntil if available (standard in Next.js 15+ middleware/routes)
      // or just fire-and-forget (risky but better than blocking)
      if (typeof (req as any).waitUntil === "function") {
        (req as any).waitUntil(notificationTask);
      }

      console.log(`[api/orders POST] Order created for user ${user.id}`);
      return ok({
        orders: createdOrders.orders,
        sessionId: createdOrders.sessionId,
        skippedRestaurants: createdOrders.closedItems,
        ignoredRestaurants: createdOrders.skippedItems,
      });
    } catch (err: unknown) {
      console.error("[api/orders POST]", err);
      if (err instanceof Error && err.message === "CART_EMPTY") {
        return fail("Cart is empty", 400);
      }
      if (err instanceof Error && err.message.startsWith("ALL_RESTAURANTS_CLOSED:")) {
        const names = err.message.split(":")[1];
        return fail(`${names} is currently closed and not accepting orders.`, 400);
      }
      return fail("Failed to create orders.", 500);
    }
  });
}

/**
 * GET /api/orders
 * Fetches all orders for the current customer with restaurant and item details.
 * Uses explicit joins instead of db.query relational layer for reliability.
 */
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await cancelExpiredPendingOrders().catch((err) => {
        console.error("[api/orders GET] Failed to sweep expired orders:", err);
      });

      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
      const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
      const scope = searchParams.get("scope") || "all";
      const offset = (page - 1) * limit;

      const activeStatuses = ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"] as const;
      const pastStatuses = ["DELIVERED", "CANCELLED"] as const;
      const scopeCondition =
        scope === "active"
          ? and(eq(orders.userId, user.id), inArray(orders.status, [...activeStatuses]))
          : scope === "past"
            ? and(eq(orders.userId, user.id), inArray(orders.status, [...pastStatuses]))
            : eq(orders.userId, user.id);

      const totalCountQuery =
        scope === "active"
          ? db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` }).from(orders).where(and(eq(orders.userId, user.id), inArray(orders.status, [...activeStatuses])))
          : scope === "past"
            ? db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` }).from(orders).where(and(eq(orders.userId, user.id), inArray(orders.status, [...pastStatuses])))
            : db.select({ count: sql<number>`CAST(COUNT(*) AS INT)` }).from(orders).where(eq(orders.userId, user.id));

      const [[{ count }], orderRows] = await Promise.all([
        totalCountQuery,
        db
          .select({
            id: orders.id,
            userId: orders.userId,
            restaurantId: orders.restaurantId,
            restaurantName: restaurants.name,
            status: orders.status,
            totalAmount: orders.totalAmount,
            deliveryFee: orders.deliveryFee,
            deliveryAddress: orders.deliveryAddress,
            deliveryArea: orders.deliveryArea,
            customerPhone: orders.customerPhone,
            currency: orders.currency,
            paymentIntentId: orders.paymentIntentId,
            sessionId: orders.sessionId,
          restaurantNameSnapshot: orders.restaurantNameSnapshot,
          deliveryJobStatus: deliveryJobs.status,
          trackingUrl: deliveryJobs.trackingUrl,
          driverName: deliveryJobs.driverName,
          driverPhone: deliveryJobs.driverPhone,
          eta: deliveryJobs.eta,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .leftJoin(deliveryJobs, eq(deliveryJobs.orderId, orders.id))
        .where(scopeCondition)
          .orderBy(
            sql`CASE WHEN ${orders.status} IN ('DELIVERED', 'CANCELLED') THEN 1 ELSE 0 END ASC`,
            desc(orders.createdAt)
          )
          .limit(limit)
          .offset(offset),
      ]);

      if (orderRows.length === 0) return ok({ orders: [] });

      // Step 2: fetch all order items for those orders in one query
      const orderIds = orderRows.map((o) => o.id);
      const itemRows = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          menuItemId: orderItems.menuItemId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          itemName: menuItems.name,
          itemImageUrl: menuItems.imageUrl,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(inArray(orderItems.orderId, orderIds));

      // Step 3: assemble
      const result = orderRows.map((order) => ({
        id: order.id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        status: order.status,
        sessionId: order.sessionId,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        deliveryAddress: order.deliveryAddress,
        deliveryArea: order.deliveryArea,
        customerPhone: order.customerPhone,
        currency: order.currency,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        restaurant: { name: order.restaurantNameSnapshot || order.restaurantName },
        deliveryJob: order.deliveryJobStatus || order.trackingUrl || order.driverName || order.driverPhone || order.eta
          ? {
              status: order.deliveryJobStatus,
              trackingUrl: order.trackingUrl,
              driverName: order.driverName,
              driverPhone: order.driverPhone,
              eta: order.eta,
            }
          : undefined,
        items: itemRows
          .filter((i) => i.orderId === order.id)
          .map((i) => ({
            id: i.id,
            quantity: i.quantity,
            price: i.price,
            menuItem: { id: i.menuItemId, name: i.itemName, imageUrl: i.itemImageUrl },
          })),
      }));

      return ok({
        orders: result,
        pagination: {
          total: count,
          page,
          limit
        }
      });
    } catch (err) {
      console.error("[api/orders GET]", err);
      return fail("Failed to fetch orders.", 500);
    }
  });
}
