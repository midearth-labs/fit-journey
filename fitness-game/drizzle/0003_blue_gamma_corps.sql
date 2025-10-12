ALTER TABLE "challenge_subscribers" ADD COLUMN "share_log_keys" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge_subscribers" DROP COLUMN "last_activity_date";--> statement-breakpoint
ALTER TABLE "user_metadata" DROP COLUMN "last_activity_date";