CREATE TYPE "public"."answer_status" AS ENUM('pending', 'approved', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."article_log_status" AS ENUM('reading_in_progress', 'knowledge_check_in_progress', 'knowledge_check_complete', 'practical_in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."avatar_age_range" AS ENUM('child', 'teen', 'young-adult', 'middle-age', 'senior');--> statement-breakpoint
CREATE TYPE "public"."avatar_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."challenge_join_type" AS ENUM('personal', 'public', 'invite-code');--> statement-breakpoint
CREATE TYPE "public"."user_challenge_status" AS ENUM('not_started', 'active', 'completed', 'locked', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('pending', 'approved', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('helpful', 'not_helpful');--> statement-breakpoint
CREATE TYPE "public"."share_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."share_type" AS ENUM('challenge_completion', 'avatar_progression', 'quiz_achievement', 'invitation_count');--> statement-breakpoint
CREATE TABLE "answer_reactions" (
	"answer_id" uuid NOT NULL,
	"user_id" uuid,
	"reaction_type" "reaction_type" NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "answer_reactions_answer_id_user_id_pk" PRIMARY KEY("answer_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "article_tracking" (
	"id" text NOT NULL,
	"partition_key" integer NOT NULL,
	"read_count" bigint DEFAULT 0 NOT NULL,
	"completed_count" bigint DEFAULT 0 NOT NULL,
	"completed_with_perfect_score" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "article_tracking_id_partition_key_pk" PRIMARY KEY("id","partition_key")
);
--> statement-breakpoint
CREATE TABLE "challenge_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" uuid,
	"joined_at" timestamp NOT NULL,
	"last_activity_date" timestamp,
	CONSTRAINT "challenge_subscribers_unique_member" UNIQUE("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" "user_challenge_status" NOT NULL,
	"log_types" jsonb NOT NULL,
	"join_type" "challenge_join_type" NOT NULL,
	"invite_code" uuid DEFAULT gen_random_uuid() NOT NULL,
	"start_date" date NOT NULL,
	"duration_days" integer NOT NULL,
	"end_date" date NOT NULL,
	"max_members" integer NOT NULL,
	"members_count" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "challenges_members_non_negative" CHECK ("challenges"."members_count" >= 0),
	CONSTRAINT "challenges_max_members_min" CHECK ("challenges"."max_members" >= 1),
	CONSTRAINT "challenges_members_within_max" CHECK ("challenges"."members_count" <= "challenges"."max_members"),
	CONSTRAINT "challenges_personal_max_one" CHECK ("challenges"."join_type" != 'personal' OR "challenges"."max_members" = 1)
);
--> statement-breakpoint
CREATE TABLE "global_tracking" (
	"partition_key" integer PRIMARY KEY NOT NULL,
	"user_count" bigint DEFAULT 0 NOT NULL,
	"invitation_join_count" bigint DEFAULT 0 NOT NULL,
	"article_read_count" bigint DEFAULT 0 NOT NULL,
	"article_completed_count" bigint DEFAULT 0 NOT NULL,
	"article_completed_with_perfect_score" bigint DEFAULT 0 NOT NULL,
	"challenges_started" bigint DEFAULT 0 NOT NULL,
	"challenges_joined" bigint DEFAULT 0 NOT NULL,
	"days_logged" bigint DEFAULT 0 NOT NULL,
	"questions_asked" bigint DEFAULT 0 NOT NULL,
	"questions_answered" bigint DEFAULT 0 NOT NULL,
	"progress_shares" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"share_type" "share_type" NOT NULL,
	"share_type_id" text,
	"title" text NOT NULL,
	"content_version" text NOT NULL,
	"generated_content" jsonb NOT NULL,
	"include_invite_link" boolean NOT NULL,
	"is_public" boolean NOT NULL,
	"status" "share_status" NOT NULL,
	"clap_count" integer NOT NULL,
	"muscle_count" integer NOT NULL,
	"party_count" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid,
	"answer" text NOT NULL,
	"is_anonymous" boolean NOT NULL,
	"status" "answer_status" NOT NULL,
	"moderation_notes" jsonb NOT NULL,
	"helpful_count" integer NOT NULL,
	"not_helpful_count" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_articles" (
	"question_id" uuid NOT NULL,
	"article_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "question_articles_question_id_article_id_pk" PRIMARY KEY("question_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "question_reactions" (
	"question_id" uuid NOT NULL,
	"user_id" uuid,
	"reaction_type" "reaction_type" NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "question_reactions_question_id_user_id_pk" PRIMARY KEY("question_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_anonymous" boolean NOT NULL,
	"status" "question_status" NOT NULL,
	"moderation_notes" jsonb NOT NULL,
	"helpful_count" integer NOT NULL,
	"not_helpful_count" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"article_id" text NOT NULL,
	"first_read_date" timestamp NOT NULL,
	"last_read_date" timestamp NOT NULL,
	"status" "article_log_status" NOT NULL,
	"quiz_all_correct_answers" boolean,
	"quiz_first_submitted_at" timestamp,
	"quiz_attempts" integer NOT NULL,
	"quiz_started_at" timestamp,
	"quiz_submitted_at" timestamp,
	"quiz_answers" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_article_unique_index" UNIQUE("user_id","article_id")
);
--> statement-breakpoint
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
CREATE TABLE "user_metadata" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enabled_features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_fitness_level" integer DEFAULT 0 NOT NULL,
	"articles_read" integer DEFAULT 0 NOT NULL,
	"articles_completed" integer DEFAULT 0 NOT NULL,
	"articles_completed_with_perfect_score" integer DEFAULT 0 NOT NULL,
	"challenges_started" integer DEFAULT 0 NOT NULL,
	"challenges_joined" integer DEFAULT 0 NOT NULL,
	"days_logged" integer DEFAULT 0 NOT NULL,
	"questions_asked" integer DEFAULT 0 NOT NULL,
	"questions_answered" integer DEFAULT 0 NOT NULL,
	"progress_shares" integer DEFAULT 0 NOT NULL,
	"current_streak_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"longest_streaks" jsonb DEFAULT '{}'::jsonb NOT NULL,
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
	"personalization_country_codes" jsonb,
	"learning_paths" jsonb,
	"timezone" text,
	"preferred_reminder_time" text,
	"notification_preferences" jsonb,
	"invitation_code" uuid DEFAULT gen_random_uuid() NOT NULL,
	"invitation_join_count" integer DEFAULT 0 NOT NULL,
	"inviter_code" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_invitation_code_unique" UNIQUE("invitation_code")
);
--> statement-breakpoint
ALTER TABLE "answer_reactions" ADD CONSTRAINT "answer_reactions_answer_id_question_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."question_answers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "answer_reactions" ADD CONSTRAINT "answer_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "challenge_subscribers" ADD CONSTRAINT "challenge_subscribers_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "challenge_subscribers" ADD CONSTRAINT "challenge_subscribers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "progress_shares" ADD CONSTRAINT "progress_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "question_articles" ADD CONSTRAINT "question_articles_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "question_reactions" ADD CONSTRAINT "question_reactions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "question_reactions" ADD CONSTRAINT "question_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_articles" ADD CONSTRAINT "user_articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_daily_logs" ADD CONSTRAINT "user_daily_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_metadata" ADD CONSTRAINT "user_metadata_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "answer_reactions_answer_index" ON "answer_reactions" USING btree ("answer_id");--> statement-breakpoint
CREATE INDEX "challenge_subscribers_user_index" ON "challenge_subscribers" USING btree ("user_id","joined_at");--> statement-breakpoint
CREATE INDEX "challenges_public_list_index" ON "challenges" USING btree ("start_date","created_at") WHERE "challenges"."join_type" = 'public';--> statement-breakpoint
CREATE INDEX "challenge_status_start_date_not_locked_inactive_index" ON "challenges" USING btree ("status","start_date") WHERE "challenges"."status" NOT IN ('locked', 'inactive');--> statement-breakpoint
CREATE INDEX "progress_shares_user_index" ON "progress_shares" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "progress_shares_type_status_index" ON "progress_shares" USING btree ("share_type","status","created_at");--> statement-breakpoint
CREATE INDEX "progress_shares_type_id_index" ON "progress_shares" USING btree ("share_type","share_type_id");--> statement-breakpoint
CREATE INDEX "progress_shares_recent_active_index" ON "progress_shares" USING btree ("share_type","created_at") WHERE "progress_shares"."status" = 'active' AND "progress_shares"."is_public" = true;--> statement-breakpoint
CREATE INDEX "question_answers_question_index" ON "question_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_answers_approved_index" ON "question_answers" USING btree ("status") WHERE "question_answers"."status" = 'approved';--> statement-breakpoint
CREATE INDEX "question_answers_user_index" ON "question_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "question_articles_question_index" ON "question_articles" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_articles_article_index" ON "question_articles" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "question_reactions_question_index" ON "question_reactions" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_status_index" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_approved_index" ON "questions" USING btree ("status") WHERE "questions"."status" = 'approved';--> statement-breakpoint
CREATE INDEX "questions_user_index" ON "questions" USING btree ("user_id");