-- Custom SQL migration file, put your code below! --

-- Function to handle user creation trigger
-- This function will be called when a new user is created in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, inviter_code, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'name',
        CASE 
            WHEN NEW.confirmed_at IS NOT NULL 
            THEN NEW.raw_user_meta_data->>'inviter_code'
            ELSE NULL
        END,
        NOW(), 
        NOW()
    );
    
    INSERT INTO public.user_metadata (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user records when auth.users is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user update trigger
-- This function will be called when a user is updated in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inviter_code if there is a valid inviter_code in metadata and no existing inviter_code in users table
    -- Only allow within the specified time window from user creation
    IF NEW.confirmed_at IS NOT NULL 
       AND NEW.raw_user_meta_data ? 'inviter_code' 
       AND NEW.raw_user_meta_data->>'inviter_code' IS NOT NULL
       AND NEW.raw_user_meta_data->>'inviter_code' != ''
       AND NEW.created_at >= NOW() - INTERVAL '48 hours'
    THEN
        UPDATE public.users 
        SET inviter_code = NEW.raw_user_meta_data->>'inviter_code'
        WHERE id = NEW.id AND (inviter_code IS NULL OR inviter_code = '') AND invitation_code != NEW.raw_user_meta_data->>'inviter_code';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update user records when auth.users is updated
CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Function to handle inviter_code update and increment invitation_join_count
-- This function will be called when a user's inviter_code is updated
CREATE OR REPLACE FUNCTION public.handle_inviter_code_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if inviter_code was set to a valid non-empty value and changed
    IF NEW.inviter_code IS NOT NULL 
       AND NEW.inviter_code != ''
       AND (OLD.inviter_code IS NULL OR OLD.inviter_code = '')
    THEN
        -- Increment invitation_join_count for the inviter user
        UPDATE public.users 
        SET invitation_join_count = invitation_join_count + 1
        WHERE invitation_code = NEW.inviter_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle inviter_code updates on public.users
CREATE OR REPLACE TRIGGER on_users_inviter_code_updated
    AFTER UPDATE OF inviter_code ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_inviter_code_update();

-- Custom SQL migration file, put your code below! --

-- Function to increment knowledge_base_completed_count
CREATE OR REPLACE FUNCTION public.increment_knowledge_base_completed_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_challenges 
    SET knowledge_base_completed_count = knowledge_base_completed_count + 1, last_activity_date = GREATEST(last_activity_date, NEW.updated_at)
    WHERE id = NEW.user_challenge_id AND user_id = NEW.user_id;
    UPDATE user_metadata
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
    UPDATE user_metadata
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

