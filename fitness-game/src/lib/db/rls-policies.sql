-- Row Level Security (RLS) Policies for FitJourney Game
-- These policies ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_level_histories ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User profiles table policies
-- Users can only access their own profile
CREATE POLICY "Users can view own profile data" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Game sessions table policies
-- Users can only access their own game sessions
CREATE POLICY "Users can view own game sessions" ON game_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own game sessions" ON game_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions" ON game_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Streak logs table policies
-- Users can only access their own streak logs
CREATE POLICY "Users can view own streak logs" ON streak_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own streak logs" ON streak_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak logs" ON streak_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Streak histories table policies
-- Users can only access their own streak histories
CREATE POLICY "Users can view own streak histories" ON streak_histories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own streak histories" ON streak_histories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak histories" ON streak_histories
    FOR UPDATE USING (auth.uid() = user_id);

-- Fitness level histories table policies
-- Users can only access their own fitness level histories
CREATE POLICY "Users can view own fitness level histories" ON fitness_level_histories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own fitness level histories" ON fitness_level_histories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness level histories" ON fitness_level_histories
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle user creation trigger
-- This function will be called when a new user is created in Supabase Auth
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
