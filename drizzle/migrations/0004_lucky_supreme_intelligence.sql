ALTER TABLE "users" ALTER COLUMN "fcm_token" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipday_carrier_id" varchar(50);