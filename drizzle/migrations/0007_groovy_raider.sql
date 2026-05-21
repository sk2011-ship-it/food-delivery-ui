CREATE TABLE "driver_shift_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"shipday_carrier_id" varchar(50),
	"is_on_shift" boolean NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shift_logs_driver_idx" ON "driver_shift_logs" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "shift_logs_recorded_at_idx" ON "driver_shift_logs" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "shift_logs_driver_date_idx" ON "driver_shift_logs" USING btree ("driver_id","recorded_at");