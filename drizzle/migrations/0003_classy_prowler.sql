DROP TABLE "whatsapp_templates" CASCADE;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "order_ids" json;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "order_count" integer DEFAULT 0 NOT NULL;