import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const supportTicketStatusEnum = ["PENDING", "ANSWERED", "CLOSED"] as const;
export const supportMessageSenderEnum = ["OWNER", "ADMIN"] as const;

export const supportTickets = pgTable("support_tickets", {
  id:         uuid("id").primaryKey().defaultRandom(),
  ownerId:    uuid("owner_id").notNull(),
  subject:    text("subject").notNull(),
  status:     text("status").$type<(typeof supportTicketStatusEnum)[number]>().default("PENDING").notNull(),
  lastReplyBy: text("last_reply_by").$type<(typeof supportMessageSenderEnum)[number]>(),
  lastReplyAt: timestamp("last_reply_at"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("support_tickets_owner_idx").on(t.ownerId),
  index("support_tickets_status_idx").on(t.status),
  index("support_tickets_updated_at_idx").on(t.updatedAt),
]);

export const supportMessages = pgTable("support_messages", {
  id:         uuid("id").primaryKey().defaultRandom(),
  ticketId:   uuid("ticket_id").notNull(),
  sender:     text("sender").$type<(typeof supportMessageSenderEnum)[number]>().notNull(),
  senderId:   uuid("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  message:    text("message").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("support_messages_ticket_idx").on(t.ticketId),
  index("support_messages_created_at_idx").on(t.createdAt),
]);
