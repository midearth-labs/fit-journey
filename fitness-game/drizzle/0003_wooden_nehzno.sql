CREATE INDEX "user_sessions_date_idx" ON "game_sessions" USING btree ("user_id","session_date_utc");--> statement-breakpoint
CREATE INDEX "all_sessions_on_day_idx" ON "game_sessions" USING btree ("session_date_utc");--> statement-breakpoint
DROP TYPE "public"."question_type";