import { z } from "zod";
import { desc, eq, inArray } from "drizzle-orm";
import { ok, fail, parseBody, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { supportMessages, supportTickets } from "@/lib/db/schema";

const SupportSchema = z.object({
  subject: z.string().min(1, "Subject is required.").max(200),
  message: z.string().min(10, "Message must be at least 10 characters.").max(5000),
});

export async function GET(req: Request) {
  return withOwnerAuth(req, async (user) => {
    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.ownerId, user.id))
      .orderBy(desc(supportTickets.updatedAt));

    const ticketIds = tickets.map((t) => t.id);
    const messages = ticketIds.length
      ? await db
          .select()
          .from(supportMessages)
          .where(inArray(supportMessages.ticketId, ticketIds))
          .orderBy(desc(supportMessages.createdAt))
      : [];

    return ok({
      tickets: tickets.map((ticket) => ({
        ...ticket,
        messages: messages.filter((m) => m.ticketId === ticket.id),
      })),
    });
  });
}

export async function POST(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      const parsed = await parseBody(req, SupportSchema);
      if ("error" in parsed) return parsed.error;

      const { subject, message } = parsed.data;
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          ownerId: user.id,
          subject,
          status: "PENDING",
          lastReplyBy: "OWNER",
          lastReplyAt: new Date(),
        })
        .returning();

      await db.insert(supportMessages).values({
        ticketId: ticket.id,
        sender: "OWNER",
        senderId: user.id,
        senderName: user.name,
        message,
      });

      await db
        .update(supportTickets)
        .set({
          lastReplyBy: "OWNER",
          lastReplyAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, ticket.id));

      return ok({ message: "Support request submitted. We will be in touch soon.", ticketId: ticket.id });
    } catch (err) {
      console.error("[api/owner/support POST]", err);
      return fail("Failed to submit support request.", 500);
    }
  });
}
