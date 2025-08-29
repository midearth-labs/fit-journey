CREATE TYPE "public"."avatar_age_range" AS ENUM('child', 'teen', 'young-adult', 'middle-age', 'senior');--> statement-breakpoint
CREATE TYPE "public"."avatar_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('standalone', 'passage_based');--> statement-breakpoint
CREATE TABLE "fitness_level_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fitness_level" integer NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" text NOT NULL,
	"session_timezone" text NOT NULL,
	"session_date_utc" date NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"in_progress" boolean DEFAULT true,
	"user_answers" jsonb,
	"all_correct_answers" boolean,
	"time_spent_seconds" integer,
	"attempt_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"streak_length" integer NOT NULL,
	"started_date" date NOT NULL,
	"ended_date" date,
	"streak_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date_utc" date NOT NULL,
	"entries" jsonb NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"latest_game_session" uuid,
	"current_fitness_level" integer DEFAULT 0 NOT NULL,
	"current_streak_ids" jsonb,
	"longest_streaks" jsonb,
	"last_activity_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "fitness_level_histories" ADD CONSTRAINT "fitness_level_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_histories" ADD CONSTRAINT "streak_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_logs" ADD CONSTRAINT "streak_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_latest_game_session_game_sessions_id_fk" FOREIGN KEY ("latest_game_session") REFERENCES "public"."game_sessions"("id") ON DELETE no action ON UPDATE no action;