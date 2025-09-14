CREATE TYPE "public"."avatar_age_range" AS ENUM('child', 'teen', 'young-adult', 'middle-age', 'senior');--> statement-breakpoint
CREATE TYPE "public"."avatar_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."user_challenge_status" AS ENUM('not_started', 'active', 'completed', 'locked', 'inactive');--> statement-breakpoint
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
	"last_activity_date" timestamp,
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
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"current_fitness_level" integer DEFAULT 0 NOT NULL,
	"current_streak_ids" jsonb,
	"longest_streaks" jsonb,
	"last_activity_date" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_gender" "avatar_gender",
	"avatar_age_range" "avatar_age_range",
	"timezone" text,
	"preferred_reminder_time" text,
	"notification_preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_challenge_id_user_challenges_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."user_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_habit_logs" ADD CONSTRAINT "user_habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_habit_logs" ADD CONSTRAINT "user_habit_logs_user_challenge_id_user_challenges_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."user_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_challenge_status_start_date_not_locked_inactive_index" ON "user_challenges" USING btree ("status","start_date") WHERE "user_challenges"."status" NOT IN ('locked', 'inactive');