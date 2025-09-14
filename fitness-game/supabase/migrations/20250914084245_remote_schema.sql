

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."avatar_age_range" AS ENUM (
    'child',
    'teen',
    'young-adult',
    'middle-age',
    'senior'
);


ALTER TYPE "public"."avatar_age_range" OWNER TO "postgres";


CREATE TYPE "public"."avatar_gender" AS ENUM (
    'male',
    'female'
);


ALTER TYPE "public"."avatar_gender" OWNER TO "postgres";


CREATE TYPE "public"."user_challenge_status" AS ENUM (
    'not_started',
    'active',
    'completed',
    'locked',
    'inactive'
);


ALTER TYPE "public"."user_challenge_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_habits_logged_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_challenges 
    SET habits_logged_count = habits_logged_count - 1
    WHERE id = OLD.user_challenge_id AND user_id = OLD.user_id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_habits_logged_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_knowledge_base_completed_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_challenges 
    SET knowledge_base_completed_count = knowledge_base_completed_count - 1
    WHERE id = OLD.user_challenge_id AND user_id = OLD.user_id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_knowledge_base_completed_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    
    INSERT INTO public.user_profiles (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_habits_logged_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_challenges 
    SET habits_logged_count = habits_logged_count + 1, last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_challenge_id AND user_id = NEW.user_id;
    UPDATE user_profiles
    SET last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_habits_logged_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_knowledge_base_completed_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_challenges 
    SET knowledge_base_completed_count = knowledge_base_completed_count + 1, last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_challenge_id AND user_id = NEW.user_id;
    UPDATE user_profiles
    SET last_activity_date = GREATEST(last_activity_date, NEW.last_attempted_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_knowledge_base_completed_count"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."user_challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_challenge_id" "uuid" NOT NULL,
    "knowledge_base_id" "text" NOT NULL,
    "all_correct_answers" boolean NOT NULL,
    "quiz_answers" "jsonb" NOT NULL,
    "first_attempted_at" timestamp without time zone NOT NULL,
    "last_attempted_at" timestamp without time zone NOT NULL,
    "attempts" integer NOT NULL
);


ALTER TABLE "public"."user_challenge_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "challenge_id" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "original_start_date" "date" NOT NULL,
    "status" "public"."user_challenge_status" NOT NULL,
    "knowledge_base_completed_count" integer NOT NULL,
    "habits_logged_count" integer NOT NULL,
    "last_activity_date" timestamp without time zone,
    "created_at" timestamp without time zone NOT NULL,
    "updated_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."user_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_habit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_challenge_id" "uuid" NOT NULL,
    "log_date" "date" NOT NULL,
    "values" "jsonb" NOT NULL,
    "created_at" timestamp without time zone NOT NULL,
    "updated_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."user_habit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "current_fitness_level" integer DEFAULT 0 NOT NULL,
    "current_streak_ids" "jsonb",
    "longest_streaks" "jsonb",
    "last_activity_date" timestamp without time zone,
    "created_at" timestamp without time zone NOT NULL,
    "updated_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "avatar_gender" "public"."avatar_gender",
    "avatar_age_range" "public"."avatar_age_range",
    "timezone" "text",
    "preferred_reminder_time" "text",
    "notification_preferences" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_article_unique" UNIQUE ("user_challenge_id", "knowledge_base_id");



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_challenges"
    ADD CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_habit_logs"
    ADD CONSTRAINT "user_daily_log_unique" UNIQUE ("user_challenge_id", "log_date");



ALTER TABLE ONLY "public"."user_habit_logs"
    ADD CONSTRAINT "user_habit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "user_challenge_status_start_date_not_locked_inactive_index" ON "public"."user_challenges" USING "btree" ("status", "start_date") WHERE ("status" <> ALL (ARRAY['locked'::"public"."user_challenge_status", 'inactive'::"public"."user_challenge_status"]));



CREATE OR REPLACE TRIGGER "trigger_decrement_habits_logged_count" AFTER DELETE ON "public"."user_habit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_habits_logged_count"();



CREATE OR REPLACE TRIGGER "trigger_decrement_knowledge_base_count" AFTER DELETE ON "public"."user_challenge_progress" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_knowledge_base_completed_count"();



CREATE OR REPLACE TRIGGER "trigger_increment_habits_logged_count" AFTER INSERT ON "public"."user_habit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."increment_habits_logged_count"();



CREATE OR REPLACE TRIGGER "trigger_increment_knowledge_base_count" AFTER INSERT ON "public"."user_challenge_progress" FOR EACH ROW EXECUTE FUNCTION "public"."increment_knowledge_base_completed_count"();



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_user_challenge_id_user_challenges_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."user_challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_challenges"
    ADD CONSTRAINT "user_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_habit_logs"
    ADD CONSTRAINT "user_habit_logs_user_challenge_id_user_challenges_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."user_challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_habit_logs"
    ADD CONSTRAINT "user_habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."decrement_habits_logged_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_habits_logged_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_habits_logged_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_knowledge_base_completed_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_knowledge_base_completed_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_knowledge_base_completed_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_habits_logged_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_habits_logged_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_habits_logged_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_knowledge_base_completed_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_knowledge_base_completed_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_knowledge_base_completed_count"() TO "service_role";


















GRANT ALL ON TABLE "public"."user_challenge_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_challenge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_challenge_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_challenges" TO "anon";
GRANT ALL ON TABLE "public"."user_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."user_habit_logs" TO "anon";
GRANT ALL ON TABLE "public"."user_habit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_habit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
