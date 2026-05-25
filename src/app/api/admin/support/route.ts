import { desc, eq } from "drizzle-orm";
import { ok, fail, parseBody, withAdminAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { supportMessages, supportTickets } from "@/lib/db/schema";
import { z } from "zod";

const ReplySchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(1).max(5000),
});

export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    const tickets = await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.updatedAt));

    const messages = await db
      .select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt));

    return ok({ tickets, messages });
  });
}

export async function POST(req: Request) {
  return withAdminAuth(req, async (user) => {
    const parsed = await parseBody(req, ReplySchema);
    if ("error" in parsed) return parsed.error;

    const { ticketId, message } = parsed.data;
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
    if (!ticket) return fail("Support ticket not found.", 404);

    await db.insert(supportMessages).values({
      ticketId,
      sender: "ADMIN",
      senderId: user.id,
      senderName: user.name,
      message,
    });

    await db
      .update(supportTickets)
      .set({
        status: "ANSWERED",
        lastReplyBy: "ADMIN",
        lastReplyAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));

    return ok({ message: "Reply sent." });
  });
}
