DROP INDEX "active_partition_date_idx";--> statement-breakpoint
DROP INDEX "user_sessions_date_idx";--> statement-breakpoint
DROP INDEX "all_sessions_on_day_idx";--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "started_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "started_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "completed_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "user_answers" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "all_correct_answers" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "time_spent_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "attempt_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "knowledge_base_article_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "created_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" DROP COLUMN "session_timezone";--> statement-breakpoint
ALTER TABLE "game_sessions" DROP COLUMN "session_date_utc";--> statement-breakpoint
ALTER TABLE "game_sessions" DROP COLUMN "in_progress";--> statement-breakpoint
ALTER TABLE "game_sessions" DROP COLUMN "active_partition_key";--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_day_idx" UNIQUE("user_id","day");