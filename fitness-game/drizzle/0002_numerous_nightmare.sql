ALTER TABLE "game_sessions" ADD COLUMN "day" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "active_partition_key" integer;--> statement-breakpoint
CREATE INDEX "active_partition_date_idx" ON "game_sessions" USING btree ("active_partition_key","session_date_utc");--> statement-breakpoint
ALTER TABLE "game_sessions" DROP COLUMN "challenge_id";