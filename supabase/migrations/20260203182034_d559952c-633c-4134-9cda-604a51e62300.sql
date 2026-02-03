-- =============================================
-- CRITICAL AUDIT IMPLEMENTATION
-- =============================================

-- 1. SCORE CACHING TABLE (Cost Defense)
-- TTL-based caching to prevent expensive re-scraping
CREATE TABLE public.entity_score_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  score INTEGER NOT NULL,
  summary TEXT,
  vibe_check TEXT,
  evidence JSONB,
  metadata JSONB,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  hit_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_score_cache_normalized ON public.entity_score_cache(normalized_name);
CREATE INDEX idx_score_cache_expires ON public.entity_score_cache(expires_at);

-- RLS for cache (read-only for all, write via edge functions)
ALTER TABLE public.entity_score_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache is publicly readable"
ON public.entity_score_cache FOR SELECT USING (true);

-- 2. SCORE HISTORY TABLE (Historical Timeline)
CREATE TABLE public.entity_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  change_amount INTEGER,
  change_reason TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_history_entity ON public.entity_score_history(entity_id, recorded_at DESC);

ALTER TABLE public.entity_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Score history is publicly readable"
ON public.entity_score_history FOR SELECT USING (true);

-- 3. STAKE-TO-VOTE SYSTEM (Anti-Bot/Sybil)
ALTER TABLE public.entity_reviews ADD COLUMN IF NOT EXISTS points_staked INTEGER NOT NULL DEFAULT 10;
ALTER TABLE public.entity_reviews ADD COLUMN IF NOT EXISTS stake_status TEXT DEFAULT 'active' CHECK (stake_status IN ('active', 'won', 'lost'));

-- 4. REVIEW BOMB PROTECTION (Velocity Tracking)
CREATE TABLE public.entity_velocity_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlocks_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  score_before INTEGER NOT NULL,
  score_after INTEGER NOT NULL,
  velocity_percent INTEGER NOT NULL
);

CREATE INDEX idx_velocity_locks_entity ON public.entity_velocity_locks(entity_id, unlocks_at DESC);

ALTER TABLE public.entity_velocity_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Velocity locks are publicly readable"
ON public.entity_velocity_locks FOR SELECT USING (true);

-- Function to check and lock on velocity spike
CREATE OR REPLACE FUNCTION public.check_review_velocity(
  _entity_id UUID,
  _new_is_positive BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_lock RECORD;
  _recent_votes RECORD;
  _total_votes INTEGER;
  _positive_votes INTEGER;
  _old_score INTEGER;
  _new_score INTEGER;
  _change_percent INTEGER;
BEGIN
  -- Check if already locked
  SELECT * INTO _current_lock
  FROM entity_velocity_locks
  WHERE entity_id = _entity_id AND unlocks_at > now()
  ORDER BY locked_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN FALSE; -- Cannot vote, entity is locked
  END IF;

  -- Get votes from last hour
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_positive) as positive
  INTO _recent_votes
  FROM entity_reviews
  WHERE entity_id = _entity_id
    AND created_at > now() - INTERVAL '1 hour';

  _total_votes := COALESCE(_recent_votes.total, 0);
  _positive_votes := COALESCE(_recent_votes.positive, 0);
  
  -- If more than 20 votes in an hour, check velocity
  IF _total_votes >= 20 THEN
    -- Calculate score change
    SELECT score INTO _old_score
    FROM entity_scores
    WHERE entity_id = _entity_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    _old_score := COALESCE(_old_score, 75);
    
    -- Simulate new score
    IF _new_is_positive THEN
      _positive_votes := _positive_votes + 1;
    END IF;
    _new_score := LEAST(100, GREATEST(0, _old_score + ((_positive_votes * 2) - ((_total_votes + 1) - _positive_votes) * 3)));
    
    _change_percent := ABS(_new_score - _old_score);
    
    -- If >20% change in 1 hour, lock for cooling off
    IF _change_percent >= 20 THEN
      INSERT INTO entity_velocity_locks (entity_id, unlocks_at, reason, score_before, score_after, velocity_percent)
      VALUES (_entity_id, now() + INTERVAL '2 hours', 'Velocity spike detected - cooling off period', _old_score, _new_score, _change_percent);
      
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- 5. GPS-WEIGHTED VOTING
ALTER TABLE public.entity_reviews ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;
ALTER TABLE public.entity_reviews ADD COLUMN IF NOT EXISTS vote_weight NUMERIC(3,2) DEFAULT 1.0;

-- 6. EMBEDDABLE WIDGET TOKENS
CREATE TABLE public.widget_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  style_config JSONB DEFAULT '{"theme": "dark", "size": "medium"}',
  domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  impression_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_widget_tokens_entity ON public.widget_tokens(entity_id);
CREATE INDEX idx_widget_tokens_token ON public.widget_tokens(token);

ALTER TABLE public.widget_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Widget tokens readable by all"
ON public.widget_tokens FOR SELECT USING (true);

CREATE POLICY "Users can create widget tokens for claimed entities"
ON public.widget_tokens FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM entities e WHERE e.id = entity_id AND e.claimed_by = auth.uid()
  )
);

CREATE POLICY "Users can manage their widget tokens"
ON public.widget_tokens FOR UPDATE
USING (created_by = auth.uid());

-- 7. LEGAL DISCLAIMERS TRACKING
CREATE TABLE public.user_disclaimer_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  disclaimer_type TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT,
  UNIQUE(user_id, disclaimer_type)
);

ALTER TABLE public.user_disclaimer_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances"
ON public.user_disclaimer_acceptances FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own acceptances"
ON public.user_disclaimer_acceptances FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 8. Function to record score history
CREATE OR REPLACE FUNCTION public.record_score_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prev_score INTEGER;
  _change_amount INTEGER;
BEGIN
  -- Get previous score
  SELECT score INTO _prev_score
  FROM entity_scores
  WHERE entity_id = NEW.entity_id AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;

  _change_amount := NEW.score - COALESCE(_prev_score, NEW.score);

  INSERT INTO entity_score_history (entity_id, score, change_amount, change_reason)
  VALUES (NEW.entity_id, NEW.score, _change_amount, 'Score update');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_record_score_history
AFTER INSERT ON public.entity_scores
FOR EACH ROW
EXECUTE FUNCTION public.record_score_history();

-- 9. Function to award/deduct stake points
CREATE OR REPLACE FUNCTION public.resolve_vote_stakes(
  _entity_id UUID,
  _winning_side BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Winners keep their stake + bonus
  UPDATE entity_reviews
  SET stake_status = 'won'
  WHERE entity_id = _entity_id
    AND is_positive = _winning_side
    AND stake_status = 'active';

  -- Award bonus to winners
  INSERT INTO points_transactions (user_id, amount, action_type, reference_id)
  SELECT user_id, points_staked + 5, 'stake_won', _entity_id
  FROM entity_reviews
  WHERE entity_id = _entity_id
    AND is_positive = _winning_side
    AND stake_status = 'won';

  -- Update user points for winners
  UPDATE user_points
  SET points = points + (
    SELECT COALESCE(SUM(points_staked + 5), 0)
    FROM entity_reviews er
    WHERE er.entity_id = _entity_id
      AND er.user_id = user_points.user_id
      AND er.is_positive = _winning_side
  );

  -- Losers forfeit their stake
  UPDATE entity_reviews
  SET stake_status = 'lost'
  WHERE entity_id = _entity_id
    AND is_positive != _winning_side
    AND stake_status = 'active';

  -- Deduct from losers
  UPDATE user_points
  SET points = GREATEST(0, points - (
    SELECT COALESCE(SUM(points_staked), 0)
    FROM entity_reviews er
    WHERE er.entity_id = _entity_id
      AND er.user_id = user_points.user_id
      AND er.is_positive != _winning_side
  ));
END;
$$;

-- 10. Add realtime for score history
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_score_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_velocity_locks;