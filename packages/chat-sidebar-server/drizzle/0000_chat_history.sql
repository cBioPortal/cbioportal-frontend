CREATE TABLE "chat_message" (
	"thread_id" text NOT NULL,
	"id" text NOT NULL,
	"parent_id" text,
	"format" text NOT NULL,
	"content" jsonb NOT NULL,
	"seq" bigserial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_message_thread_id_id_pk" PRIMARY KEY("thread_id","id")
);
--> statement-breakpoint
CREATE TABLE "chat_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"status" text DEFAULT 'regular' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_thread_status_check" CHECK ("chat_thread"."status" in ('regular', 'archived'))
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_thread_seq_idx" ON "chat_message" USING btree ("thread_id","seq");--> statement-breakpoint
CREATE INDEX "chat_thread_user_updated_idx" ON "chat_thread" USING btree ("user_id","updated_at" DESC NULLS LAST);