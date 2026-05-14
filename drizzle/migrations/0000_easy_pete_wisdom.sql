CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin', 'driver', 'owner');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'banned');--> statement-breakpoint
CREATE TYPE "public"."restaurant_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."menu_item_status" AS ENUM('available', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."featured_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."featured_type" AS ENUM('restaurant', 'dish');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(150) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"last_active" timestamp,
	"fcm_token" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"location" varchar(100),
	"logo_url" varchar(500),
	"owner_id" uuid,
	"manager_phone" varchar(30),
	"contact_email" varchar(150) NOT NULL,
	"contact_phone" varchar(30) NOT NULL,
	"business_reg_no" varchar(100),
	"opening_hours" jsonb,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" "restaurant_status" DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_mobile_chef" boolean DEFAULT false NOT NULL,
	"deletion_status" text,
	"deletion_requested_at" timestamp,
	"deletion_scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" "menu_item_status" DEFAULT 'available' NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "featured_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"location" varchar(100) NOT NULL,
	"status" "featured_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"restaurant_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING_CONFIRMATION' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"service_charge" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery_address" text,
	"delivery_area" text,
	"distance_miles" numeric(10, 4),
	"customer_phone" text,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"payment_intent_id" text,
	"is_settled" text DEFAULT 'NO' NOT NULL,
	"session_id" uuid,
	"restaurant_name_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"total_items_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_service_charge" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery_address" text,
	"delivery_area" text,
	"distance_miles" numeric(10, 4),
	"customer_phone" text,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"payment_intent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"session_id" uuid,
	"user_id" uuid,
	"restaurant_id" uuid,
	"order_placed_at" timestamp,
	"owner_notified_at" timestamp,
	"confirmed_at" timestamp,
	"payment_initiated_at" timestamp,
	"paid_at" timestamp,
	"kitchen_started_at" timestamp,
	"dispatched_at" timestamp,
	"delivered_at" timestamp,
	"cancelled_at" timestamp,
	"wait_time_ms" integer,
	"payment_delay_ms" integer,
	"kitchen_time_ms" integer,
	"delivery_time_ms" integer,
	"total_fulfillment_ms" integer,
	"cancellation_reason" text,
	"delivery_area" text,
	"day_of_week" integer,
	"hour_of_day" integer,
	"order_total" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_metrics_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "delivery_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'shipday' NOT NULL,
	"status" text DEFAULT 'DISPATCH_REQUESTED' NOT NULL,
	"provider_order_id" text,
	"tracking_id" text,
	"tracking_url" text,
	"driver_name" text,
	"driver_phone" text,
	"eta" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_jobs_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"restaurant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"status" text DEFAULT 'inactive' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_order_unique_idx" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"transaction_id" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" varchar(255) NOT NULL,
	"action" varchar(32) NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp NOT NULL,
	"blocked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_order_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."order_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_name_idx" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "users_search_gin_idx" ON "users" USING gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(email, '')));--> statement-breakpoint
CREATE INDEX "restaurants_name_idx" ON "restaurants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "restaurants_owner_idx" ON "restaurants" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "restaurants_status_idx" ON "restaurants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "restaurants_created_at_idx" ON "restaurants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "restaurants_search_gin_idx" ON "restaurants" USING gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(contact_email, '')));--> statement-breakpoint
CREATE INDEX "menu_items_restaurant_idx" ON "menu_items" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "menu_items_status_idx" ON "menu_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "featured_items_type_location_idx" ON "featured_items" USING btree ("type","location");--> statement-breakpoint
CREATE INDEX "featured_items_status_idx" ON "featured_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "featured_items_entity_idx" ON "featured_items" USING btree ("entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_menu_item" ON "cart_items" USING btree ("user_id","menu_item_id");--> statement-breakpoint
CREATE INDEX "cart_items_user_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_items_menu_item_idx" ON "cart_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_restaurant_idx" ON "orders" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_session_idx" ON "orders" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "order_sessions_user_idx" ON "order_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_sessions_status_idx" ON "order_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_metrics_user_idx" ON "order_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_metrics_restaurant_idx" ON "order_metrics" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "order_metrics_session_idx" ON "order_metrics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "order_metrics_placed_idx" ON "order_metrics" USING btree ("order_placed_at");--> statement-breakpoint
CREATE INDEX "order_metrics_restaurant_confirmed_idx" ON "order_metrics" USING btree ("restaurant_id","confirmed_at");--> statement-breakpoint
CREATE INDEX "delivery_jobs_provider_idx" ON "delivery_jobs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "delivery_jobs_status_idx" ON "delivery_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "delivery_jobs_provider_order_idx" ON "delivery_jobs" USING btree ("provider_order_id");--> statement-breakpoint
CREATE INDEX "delivery_jobs_tracking_idx" ON "delivery_jobs" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_restaurant_idx" ON "reviews" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "reviews_order_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settlements_restaurant_idx" ON "settlements" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "settlements_created_at_idx" ON "settlements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ip_rate_limits_ip_action_idx" ON "ip_rate_limits" USING btree ("ip_address","action");--> statement-breakpoint
CREATE INDEX "ip_rate_limits_blocked_until_idx" ON "ip_rate_limits" USING btree ("blocked_until");--> statement-breakpoint
CREATE UNIQUE INDEX "ip_rate_limits_ip_action_unique" ON "ip_rate_limits" USING btree ("ip_address","action");