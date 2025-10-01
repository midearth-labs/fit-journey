ALTER TYPE "public"."all_log_keys" ADD VALUE 'weight';--> statement-breakpoint
ALTER TYPE "public"."all_log_keys" ADD VALUE 'stepsWalked';--> statement-breakpoint
ALTER TYPE "public"."all_log_keys" ADD VALUE 'cardioMinutes';--> statement-breakpoint
ALTER TYPE "public"."all_log_keys" ADD VALUE 'pushups';--> statement-breakpoint

ALTER TABLE "user_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_logs" CASCADE;--> statement-breakpoint

CREATE TABLE "user_daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"five_star_values" jsonb NOT NULL,
	"measurement_values" jsonb NOT NULL,
	"log_date" date NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_daily_log_unique" UNIQUE("user_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "user_daily_logs" ADD CONSTRAINT "user_daily_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
