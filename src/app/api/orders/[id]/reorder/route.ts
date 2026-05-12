import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, restaurants, users, notifications, menuItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/reorder
 * Clones an existing order and its items for the authenticated user.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: originalOrderId } = await params;

  return withAuth(req, async (user) => {
    try {
      // 1. Fetch original order
      const [originalOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, originalOrderId))
        .limit(1);

      if (!originalOrder) {
        return fail("Original order not found", 404);
      }

      // 2. Security check: only the customer who placed the order can reorder it
      if (originalOrder.userId !== user.id) {
        return fail("Unauthorized to reorder this order", 403);
      }

      // 3. Fetch original order items
      const originalItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, originalOrderId));

      if (originalItems.length === 0) {
        return fail("Original order has no items", 400);
      }

      // 4. Create new order in a transaction
      const newOrder = await db.transaction(async (tx) => {

        const subtotal = originalItems.reduce((sum, item) => sum + (parseFloat(item.price as string) * item.quantity), 0);
        
        const total = subtotal + parseFloat(originalOrder.deliveryFee || "0");

        const [insertedOrder] = await tx.insert(orders).values({
          userId: user.id,
          restaurantId: originalOrder.restaurantId,
          totalAmount: total.toFixed(2),
          deliveryFee: originalOrder.deliveryFee,
          deliveryAddress: originalOrder.deliveryAddress,
          deliveryArea: originalOrder.deliveryArea,
          distanceMiles: originalOrder.distanceMiles,
          customerPhone: originalOrder.customerPhone,
          currency: originalOrder.currency,
          status: "PENDING_CONFIRMATION", // Reset status
          isSettled: "NO",
        }).returning();

        await tx.insert(orderItems).values(
          originalItems.map(item => ({
            orderId: insertedOrder.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          }))
        );

        return insertedOrder;
      });

      // 5. Notify restaurant owner
      try {
        const [restaurant] = await db
          .select({ ownerId: restaurants.ownerId, name: restaurants.name })
          .from(restaurants)
          .where(eq(restaurants.id, newOrder.restaurantId))
          .limit(1);

        if (restaurant) {
          const subject = "New Order Received!";
          
          const itemsRows = await db
            .select({
              name: menuItems.name,
              quantity: orderItems.quantity,
            })
            .from(orderItems)
            .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(eq(orderItems.orderId, newOrder.id));
          
          const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
          const ownerBody = `New Order! 🛍️\nOrder: #${newOrder.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: NEW\n\nItems:\n${itemsSummary}\n\nTotal: £${newOrder.totalAmount}`;

          // Dispatch Owner Notifications
          if (restaurant.ownerId) {
            await NotificationService.dispatchOrderNotifications({
              userId: restaurant.ownerId ?? "",
              type: "ORDER",
              subject,
              body: ownerBody,
              metadata: {
                orderId: newOrder.id,
                orderStatus: "PENDING_CONFIRMATION",
                targetRole: "owner",
                // Twilio verified template: new_order_owner_alert
                twilioContentSid: "HXd342e729a217385fbc2bc86c42e53801",
                twilioVariables: {
                  "1": newOrder.id.slice(0, 8).toUpperCase(),
                  "2": restaurant.name,
                  "3": itemsSummary,
                  "4": `£${newOrder.totalAmount}`,
                },
              },
              channels: ["FCM", "WHATSAPP"]
            });
          }

           // Dispatch Customer Notifications
          if (newOrder.userId) {
            await NotificationService.dispatchOrderNotifications({
              userId: newOrder.userId,
              type: "ORDER",
              subject: "Order Received! 🛍️",
              body: `Your order #${newOrder.id.slice(0, 8)} from ${restaurant.name} has been received.`,
              metadata: {
                orderId: newOrder.id,
                orderStatus: "PENDING_CONFIRMATION",
                targetRole: "customer",
                // Twilio verified template: order_update_notification
                twilioContentSid: "HX8fc09c456a92a49269c2ba5a93e8831e",
                twilioVariables: {
                  "1": newOrder.id.slice(0, 8).toUpperCase(),
                  "2": restaurant.name,
                  "3": "Order Received",
                },
              },
              channels: ["FCM", "WHATSAPP"]
            });
          }
        }
      } catch (notifyErr) {
        console.error("Failed to queue notification for reorder:", notifyErr);
      }

      return ok({ order: newOrder });
    } catch (err) {
      console.error("[api/orders/[id]/reorder POST]", err);
      return fail("Failed to reorder.", 500);
    }
  });
}
