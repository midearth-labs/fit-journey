ALTER TABLE "challenges" ADD COLUMN "end_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge_subscribers" DROP COLUMN "daily_log_count";