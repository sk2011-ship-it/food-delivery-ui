CREATE TABLE "whatsapp_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"twilio_content_sid" text NOT NULL,
	"purpose" text NOT NULL,
	"body_preview" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_templates_name_unique" UNIQUE("name"),
	CONSTRAINT "whatsapp_templates_twilio_content_sid_unique" UNIQUE("twilio_content_sid")
);
