CREATE TYPE "public"."user_challenge_status" AS ENUM('not_started', 'active', 'completed', 'locked');--> statement-breakpoint
CREATE TABLE "user_challenge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_challenge_id" uuid NOT NULL,
	"knowledge_base_id" text NOT NULL,
	"all_correct_answers" boolean NOT NULL,
	"quiz_answers" jsonb NOT NULL,
	"first_attempted_at" timestamp NOT NULL,
	"last_attempted_at" timestamp NOT NULL,
	"attempts" integer NOT NULL,
	CONSTRAINT "user_challenge_article_unique" UNIQUE("user_challenge_id","knowledge_base_id")
);
--> statement-breakpoint
CREATE TABLE "user_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" text NOT NULL,
	"start_date" date NOT NULL,
	"original_start_date" date NOT NULL,
	"status" "user_challenge_status" NOT NULL,
	"knowledge_base_completed_count" integer NOT NULL,
	"habits_logged_count" integer NOT NULL,
	"completed_at" timestamp,
	"locked_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_habit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_challenge_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"values" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_daily_log_unique" UNIQUE("user_challenge_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "game_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "game_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_users_id_fk";
--> statement-breakpoint
-- ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_latest_game_session_game_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_challenge_id_user_challenges_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."user_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_habit_logs" ADD CONSTRAINT "user_habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_habit_logs" ADD CONSTRAINT "user_habit_logs_user_challenge_id_user_challenges_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."user_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "latest_game_session";