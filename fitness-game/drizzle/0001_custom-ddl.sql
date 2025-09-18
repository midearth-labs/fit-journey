-- Custom SQL migration file, put your code below! --

-- Function to handle user creation trigger
-- This function will be called when a new user is created in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    
    INSERT INTO public.user_profiles (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user records when auth.users is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Custom SQL migration file, put your code below! --

-- Function to increment knowledge_base_completed_count
CREATE OR REPLACE FUNCTION public.increment_knowledge_base_completed_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET knowledge_base_completed_count = knowledge_base_completed_count + 1, last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_challenge_id AND user_id = NEW.user_id;
    UPDATE user_profiles
    SET last_activity_date = GREATEST(last_activity_date, NEW.last_attempted_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement knowledge_base_completed_count
CREATE OR REPLACE FUNCTION public.decrement_knowledge_base_completed_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET knowledge_base_completed_count = knowledge_base_completed_count - 1
    WHERE id = OLD.user_challenge_id AND user_id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment daily_log_count
CREATE OR REPLACE FUNCTION public.increment_daily_log_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET daily_log_count = daily_log_count + 1, last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_challenge_id AND user_id = NEW.user_id;
    UPDATE user_profiles
    SET last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement daily_log_count
CREATE OR REPLACE FUNCTION public.decrement_daily_log_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET daily_log_count = daily_log_count - 1
    WHERE id = OLD.user_challenge_id AND user_id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for user_challenge_progress table
CREATE OR REPLACE TRIGGER trigger_increment_knowledge_base_count
    AFTER INSERT ON user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_knowledge_base_completed_count();

CREATE OR REPLACE TRIGGER trigger_decrement_knowledge_base_count
    AFTER DELETE ON user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_knowledge_base_completed_count();

-- Triggers for user_logs table
CREATE OR REPLACE TRIGGER trigger_increment_daily_log_count
    AFTER INSERT ON user_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_daily_log_count();

CREATE OR REPLACE TRIGGER trigger_decrement_daily_log_count
    AFTER DELETE ON user_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_daily_log_count();

