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

-- Function to increment habits_logged_count
CREATE OR REPLACE FUNCTION public.increment_habits_logged_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET habits_logged_count = habits_logged_count + 1, last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_challenge_id AND user_id = NEW.user_id;
    UPDATE user_profiles
    SET last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement habits_logged_count
CREATE OR REPLACE FUNCTION public.decrement_habits_logged_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET habits_logged_count = habits_logged_count - 1
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

-- Triggers for user_habit_logs table
CREATE OR REPLACE TRIGGER trigger_increment_habits_logged_count
    AFTER INSERT ON user_habit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_habits_logged_count();

CREATE OR REPLACE TRIGGER trigger_decrement_habits_logged_count
    AFTER DELETE ON user_habit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_habits_logged_count();