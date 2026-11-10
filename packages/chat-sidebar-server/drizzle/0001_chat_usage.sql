CREATE TABLE "chat_usage" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weighted" integer NOT NULL,
	"billed_to" text DEFAULT 'portal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_usage_billed_to_check" CHECK ("chat_usage"."billed_to" in ('portal', 'user'))
);
--> statement-breakpoint
CREATE INDEX "chat_usage_user_created_idx" ON "chat_usage" USING btree ("user_id","created_at");