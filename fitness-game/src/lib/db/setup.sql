-- FitJourney Game Database Setup Script
-- This script sets up the complete database schema with RLS policies

-- @TODO: check how this is used or needs to be removed cos there is the migration sql and also rls-policies.sql
-- or maybe this is for one off setup

-- Create custom types/enums
DO $$ BEGIN
 CREATE TYPE "avatar_age_range" AS ENUM('child', 'teen', 'young-adult', 'middle-age', 'senior');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "avatar_gender" AS ENUM('male', 'female');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "question_type" AS ENUM('standalone', 'passage_based');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS "users" (
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

CREATE TABLE IF NOT EXISTS "user_profiles" (
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

CREATE TABLE IF NOT EXISTS "game_sessions" (
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

CREATE TABLE IF NOT EXISTS "streak_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date_utc" date NOT NULL,
	"entries" jsonb NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "streak_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"streak_length" integer NOT NULL,
	"started_date" date NOT NULL,
	"ended_date" date,
	"streak_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fitness_level_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fitness_level" integer NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);

-- Create foreign key constraints
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_latest_game_session_game_sessions_id_fk" FOREIGN KEY ("latest_game_session") REFERENCES "game_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "streak_logs" ADD CONSTRAINT "streak_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "streak_histories" ADD CONSTRAINT "streak_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "fitness_level_histories" ADD CONSTRAINT "fitness_level_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_level_histories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User profiles table policies
DROP POLICY IF EXISTS "Users can view own profile data" ON user_profiles;
CREATE POLICY "Users can view own profile data" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Game sessions table policies
DROP POLICY IF EXISTS "Users can view own game sessions" ON game_sessions;
CREATE POLICY "Users can view own game sessions" ON game_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own game sessions" ON game_sessions;
CREATE POLICY "Users can create own game sessions" ON game_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own game sessions" ON game_sessions;
CREATE POLICY "Users can update own game sessions" ON game_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Streak logs table policies
DROP POLICY IF EXISTS "Users can view own streak logs" ON streak_logs;
CREATE POLICY "Users can view own streak logs" ON streak_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own streak logs" ON streak_logs;
CREATE POLICY "Users can create own streak logs" ON streak_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streak logs" ON streak_logs;
CREATE POLICY "Users can update own streak logs" ON streak_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Streak histories table policies
DROP POLICY IF EXISTS "Users can view own streak histories" ON streak_histories;
CREATE POLICY "Users can view own streak histories" ON streak_histories
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own streak histories" ON streak_histories;
CREATE POLICY "Users can create own streak histories" ON streak_histories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streak histories" ON streak_histories;
CREATE POLICY "Users can update own streak histories" ON streak_histories
    FOR UPDATE USING (auth.uid() = user_id);

-- Fitness level histories table policies
DROP POLICY IF EXISTS "Users can view own fitness level histories" ON fitness_level_histories;
CREATE POLICY "Users can view own fitness level histories" ON fitness_level_histories
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own fitness level histories" ON fitness_level_histories;
CREATE POLICY "Users can create own fitness level histories" ON fitness_level_histories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own fitness level histories" ON fitness_level_histories;
CREATE POLICY "Users can update own fitness level histories" ON fitness_level_histories
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user records when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_user_profiles_user_id" ON "user_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_user_id" ON "game_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_challenge_id" ON "game_sessions" ("challenge_id");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_session_date_utc" ON "game_sessions" ("session_date_utc");
CREATE INDEX IF NOT EXISTS "idx_streak_logs_user_id" ON "streak_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_streak_logs_date_utc" ON "streak_logs" ("date_utc");
CREATE INDEX IF NOT EXISTS "idx_streak_histories_user_id" ON "streak_histories" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_streak_histories_streak_type" ON "streak_histories" ("streak_type");
CREATE INDEX IF NOT EXISTS "idx_fitness_level_histories_user_id" ON "fitness_level_histories" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_fitness_level_histories_calculated_at" ON "fitness_level_histories" ("calculated_at");

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
