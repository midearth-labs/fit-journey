ALTER TABLE "answer_reactions" DROP CONSTRAINT "answer_reactions_answer_id_question_answers_id_fk";
--> statement-breakpoint
ALTER TABLE "answer_reactions" DROP CONSTRAINT "answer_reactions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "challenge_subscribers" DROP CONSTRAINT "challenge_subscribers_challenge_id_challenges_id_fk";
--> statement-breakpoint
ALTER TABLE "challenge_subscribers" DROP CONSTRAINT "challenge_subscribers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "challenges" DROP CONSTRAINT "challenges_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "progress_shares" DROP CONSTRAINT "progress_shares_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "question_answers" DROP CONSTRAINT "question_answers_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "question_answers" DROP CONSTRAINT "question_answers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "question_articles" DROP CONSTRAINT "question_articles_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "question_reactions" DROP CONSTRAINT "question_reactions_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "question_reactions" DROP CONSTRAINT "question_reactions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_articles" DROP CONSTRAINT "user_articles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_daily_logs" DROP CONSTRAINT "user_daily_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_metadata" DROP CONSTRAINT "user_metadata_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_metadata" ADD COLUMN "articles_completed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
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
ALTER TABLE "user_metadata" ADD CONSTRAINT "user_metadata_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;