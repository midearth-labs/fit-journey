-- Custom SQL migration file, put your code below! --

-- Function to handle user creation trigger
-- This function will be called when a new user is created in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, inviter_code, learning_paths, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'name',
        CASE 
            WHEN NEW.confirmed_at IS NOT NULL 
            THEN NEW.raw_user_meta_data->>'inviter_code'
            ELSE NULL
        END,
        NEW.raw_user_meta_data->>'learning_paths',
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


-- =============================================
-- Global Tracking Upsert + Triggers
-- =============================================

-- Helper function: upsert deltas into global_tracking using random partition key (1..50)
CREATE OR REPLACE FUNCTION public.upsert_global_tracking(
    p_user_count bigint DEFAULT 0,
    p_invitation_join_count bigint DEFAULT 0,
    p_article_read_count bigint DEFAULT 0,
    p_article_completed_count bigint DEFAULT 0,
    p_article_completed_with_perfect_score bigint DEFAULT 0,
    p_challenges_started bigint DEFAULT 0,
    p_challenges_joined bigint DEFAULT 0,
    p_days_logged bigint DEFAULT 0,
    p_questions_asked bigint DEFAULT 0,
    p_questions_answered bigint DEFAULT 0,
    p_progress_shares bigint DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    v_partition_key integer := FLOOR(random() * 100)::integer + 1;
BEGIN
    UPDATE public.global_tracking SET
        user_count = user_count + p_user_count,
        invitation_join_count = invitation_join_count + p_invitation_join_count,
        article_read_count = article_read_count + p_article_read_count,
        article_completed_count = article_completed_count + p_article_completed_count,
        article_completed_with_perfect_score = article_completed_with_perfect_score + p_article_completed_with_perfect_score,
        challenges_started = challenges_started + p_challenges_started,
        challenges_joined = challenges_joined + p_challenges_joined,
        days_logged = days_logged + p_days_logged,
        questions_asked = questions_asked + p_questions_asked,
        questions_answered = questions_answered + p_questions_answered,
        progress_shares = progress_shares + p_progress_shares
    WHERE partition_key = v_partition_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users: maintain user_count and invitation_join_count
CREATE OR REPLACE FUNCTION public.global_track_users_ins()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        1, -- user_count
        COALESCE(NEW.invitation_join_count, 0) -- invitation_join_count
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.global_track_users_del()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        -1, -- user_count
        -COALESCE(OLD.invitation_join_count, 0) -- invitation_join_count
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.global_track_users_upd()
RETURNS TRIGGER AS $$
DECLARE
    v_delta bigint := COALESCE(NEW.invitation_join_count, 0) - COALESCE(OLD.invitation_join_count, 0);
BEGIN
    IF v_delta <> 0 THEN
        PERFORM public.upsert_global_tracking(0, v_delta);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_global_users_ins
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.global_track_users_ins();

CREATE OR REPLACE TRIGGER trg_global_users_del
    AFTER DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.global_track_users_del();

CREATE OR REPLACE TRIGGER trg_global_users_upd_invite_join
    AFTER UPDATE OF invitation_join_count ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.global_track_users_upd();

-- Article Tracking: maintain article_* aggregates
CREATE OR REPLACE FUNCTION public.global_track_article_tracking_ins()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        0, 0,
        COALESCE(NEW.read_count, 0),
        COALESCE(NEW.completed_count, 0),
        COALESCE(NEW.completed_with_perfect_score, 0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.global_track_article_tracking_del()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        0, 0,
        -COALESCE(OLD.read_count, 0),
        -COALESCE(OLD.completed_count, 0),
        -COALESCE(OLD.completed_with_perfect_score, 0)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.global_track_article_tracking_upd()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        0, 0,
        COALESCE(NEW.read_count, 0) - COALESCE(OLD.read_count, 0),
        COALESCE(NEW.completed_count, 0) - COALESCE(OLD.completed_count, 0),
        COALESCE(NEW.completed_with_perfect_score, 0) - COALESCE(OLD.completed_with_perfect_score, 0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_global_article_tracking_ins
    AFTER INSERT ON public.article_tracking
    FOR EACH ROW EXECUTE FUNCTION public.global_track_article_tracking_ins();

CREATE OR REPLACE TRIGGER trg_global_article_tracking_del
    AFTER DELETE ON public.article_tracking
    FOR EACH ROW EXECUTE FUNCTION public.global_track_article_tracking_del();

CREATE OR REPLACE TRIGGER trg_global_article_tracking_upd
    AFTER UPDATE ON public.article_tracking
    FOR EACH ROW EXECUTE FUNCTION public.global_track_article_tracking_upd();

-- User Metadata: maintain many counters
CREATE OR REPLACE FUNCTION public.global_track_user_metadata_ins()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        0, 0, 0, 0, 0,
        COALESCE(NEW.challenges_started, 0),
        COALESCE(NEW.challenges_joined, 0),
        COALESCE(NEW.days_logged, 0),
        COALESCE(NEW.questions_asked, 0),
        COALESCE(NEW.questions_answered, 0),
        COALESCE(NEW.progress_shares, 0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.global_track_user_metadata_del()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        0, 0, 0, 0, 0,
        -COALESCE(OLD.challenges_started, 0),
        -COALESCE(OLD.challenges_joined, 0),
        -COALESCE(OLD.days_logged, 0),
        -COALESCE(OLD.questions_asked, 0),
        -COALESCE(OLD.questions_answered, 0),
        -COALESCE(OLD.progress_shares, 0)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.global_track_user_metadata_upd()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.upsert_global_tracking(
        0, 0, 0, 0, 0,
        COALESCE(NEW.challenges_started, 0) - COALESCE(OLD.challenges_started, 0),
        COALESCE(NEW.challenges_joined, 0) - COALESCE(OLD.challenges_joined, 0),
        COALESCE(NEW.days_logged, 0) - COALESCE(OLD.days_logged, 0),
        COALESCE(NEW.questions_asked, 0) - COALESCE(OLD.questions_asked, 0),
        COALESCE(NEW.questions_answered, 0) - COALESCE(OLD.questions_answered, 0),
        COALESCE(NEW.progress_shares, 0) - COALESCE(OLD.progress_shares, 0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_global_user_metadata_ins
    AFTER INSERT ON public.user_metadata
    FOR EACH ROW EXECUTE FUNCTION public.global_track_user_metadata_ins();

CREATE OR REPLACE TRIGGER trg_global_user_metadata_del
    AFTER DELETE ON public.user_metadata
    FOR EACH ROW EXECUTE FUNCTION public.global_track_user_metadata_del();

CREATE OR REPLACE TRIGGER trg_global_user_metadata_upd
    AFTER UPDATE ON public.user_metadata
    FOR EACH ROW EXECUTE FUNCTION public.global_track_user_metadata_upd();

-- Seed global_tracking rows for partition keys 1..100 so UPDATE-only logic works day 1
DO $$
DECLARE
    i integer;
BEGIN
    FOR i IN 1..100 LOOP
        INSERT INTO public.global_tracking (partition_key) VALUES (i)
    END LOOP;
END $$;

-- Seed article_tracking rows for all 70 articles with partition keys 1..10
DO $$
DECLARE
    article_ids text[] := ARRAY[
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440006',
        '550e8400-e29b-41d4-a716-446655440007',
        '550e8400-e29b-41d4-a716-446655440008',
        '550e8400-e29b-41d4-a716-446655440009',
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
        '550e8400-e29b-41d4-a716-446655440012',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
        '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
        '8ba7b813-9dad-11d1-80b4-00c04fd430c8',
        '8ba7b814-9dad-11d1-80b4-00c04fd430c8',
        '8ba7b815-9dad-11d1-80b4-00c04fd430c8',
        '9ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '9ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '9ba7b812-9dad-11d1-80b4-00c04fd430c8',
        '9ba7b813-9dad-11d1-80b4-00c04fd430c8',
        '9ba7b814-9dad-11d1-80b4-00c04fd430c8',
        '9ba7b815-9dad-11d1-80b4-00c04fd430c8',
        'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        'a47ac10b-58cc-4372-a567-0e02b2c3d481',
        'a47ac10b-58cc-4372-a567-0e02b2c3d482',
        'a47ac10b-58cc-4372-a567-0e02b2c3d483',
        'a47ac10b-58cc-4372-a567-0e02b2c3d484',
        'a47ac10b-58cc-4372-a567-0e02b2c3d485',
        'a47ac10b-58cc-4372-a567-0e02b2c3d486',
        'a47ac10b-58cc-4372-a567-0e02b2c3d487',
        'a47ac10b-58cc-4372-a567-0e02b2c3d488',
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'b47ac10b-58cc-4372-a567-0e02b2c3d483',
        'b47ac10b-58cc-4372-a567-0e02b2c3d484',
        'c2d3e4f5-a6b7-c8d9-e0f1-a2b3c4d5e6f9',
        'c47ac10b-58cc-4372-a567-0e02b2c3d479',
        'c47ac10b-58cc-4372-a567-0e02b2c3d480',
        'c47ac10b-58cc-4372-a567-0e02b2c3d481',
        'c47ac10b-58cc-4372-a567-0e02b2c3d482',
        'c47ac10b-58cc-4372-a567-0e02b2c3d483',
        'd47ac10b-58cc-4372-a567-0e02b2c3d479',
        'd47ac10b-58cc-4372-a567-0e02b2c3d480',
        'd47ac10b-58cc-4372-a567-0e02b2c3d481',
        'd47ac10b-58cc-4372-a567-0e02b2c3d482',
        'd47ac10b-58cc-4372-a567-0e02b2c3d483',
        'd47ac10b-58cc-4372-a567-0e02b2c3d484',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        'f47ac10b-58cc-4372-a567-0e02b2c3d482',
        'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        'f47ac10b-58cc-4372-a567-0e02b2c3d484',
        'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        'f47ac10b-58cc-4372-a567-0e02b2c3d487',
        'f47ac10b-58cc-4372-a567-0e02b2c3d488',
        'f47ac10b-58cc-4372-a567-0e02b2c3d489',
        'f47ac10b-58cc-4372-a567-0e02b2c3d490',
        'f47ac10b-58cc-4372-a567-0e02b2c3d491'
    ];
    article_id text;
    partition_key integer;
BEGIN
    FOREACH article_id IN ARRAY article_ids LOOP
        FOR partition_key IN 1..10 LOOP
            INSERT INTO public.article_tracking (id, partition_key) 
            VALUES (article_id, partition_key)
        END LOOP;
    END LOOP;
END $$;
