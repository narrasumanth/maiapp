-- Add dispute voting table for public resolution
CREATE TABLE public.dispute_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_for_disputer BOOLEAN NOT NULL, -- true = support disputer, false = support entity
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dispute_id, user_id)
);

-- Enable RLS
ALTER TABLE public.dispute_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for dispute_votes
CREATE POLICY "Dispute votes viewable by everyone"
ON public.dispute_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote on disputes"
ON public.dispute_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote"
ON public.dispute_votes FOR UPDATE
USING (auth.uid() = user_id);

-- Add voting counts and resolution fields to disputes
ALTER TABLE public.disputes 
ADD COLUMN IF NOT EXISTS votes_for_disputer INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS votes_against_disputer INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_resolved_by_voting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- Add reputation fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS disputes_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS disputes_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_tier TEXT DEFAULT 'newcomer';

-- Function to update dispute vote counts
CREATE OR REPLACE FUNCTION public.update_dispute_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_for_disputer THEN
      UPDATE public.disputes SET votes_for_disputer = votes_for_disputer + 1 WHERE id = NEW.dispute_id;
    ELSE
      UPDATE public.disputes SET votes_against_disputer = votes_against_disputer + 1 WHERE id = NEW.dispute_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_for_disputer AND NOT NEW.vote_for_disputer THEN
      UPDATE public.disputes SET 
        votes_for_disputer = votes_for_disputer - 1,
        votes_against_disputer = votes_against_disputer + 1 
      WHERE id = NEW.dispute_id;
    ELSIF NOT OLD.vote_for_disputer AND NEW.vote_for_disputer THEN
      UPDATE public.disputes SET 
        votes_for_disputer = votes_for_disputer + 1,
        votes_against_disputer = votes_against_disputer - 1 
      WHERE id = NEW.dispute_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_for_disputer THEN
      UPDATE public.disputes SET votes_for_disputer = votes_for_disputer - 1 WHERE id = OLD.dispute_id;
    ELSE
      UPDATE public.disputes SET votes_against_disputer = votes_against_disputer - 1 WHERE id = OLD.dispute_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for vote count updates
CREATE TRIGGER update_dispute_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.dispute_votes
FOR EACH ROW EXECUTE FUNCTION public.update_dispute_vote_counts();

-- Function to resolve disputes and award/deduct points
CREATE OR REPLACE FUNCTION public.resolve_dispute_by_voting(
  _dispute_id UUID,
  _winner_is_disputer BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  _disputer_id UUID;
  _points_amount INTEGER := 50;
  _vote RECORD;
BEGIN
  -- Get disputer ID
  SELECT user_id INTO _disputer_id FROM public.disputes WHERE id = _dispute_id;
  
  -- Update dispute status
  UPDATE public.disputes SET 
    status = 'resolved',
    is_resolved_by_voting = true,
    resolved_at = now(),
    points_awarded = _points_amount
  WHERE id = _dispute_id;
  
  -- Award/deduct points for disputer
  IF _winner_is_disputer THEN
    PERFORM public.award_points(_disputer_id, _points_amount, 'dispute_won', _dispute_id);
    UPDATE public.profiles SET disputes_won = disputes_won + 1 WHERE user_id = _disputer_id;
  ELSE
    PERFORM public.award_points(_disputer_id, -25, 'dispute_lost', _dispute_id);
    UPDATE public.profiles SET disputes_lost = disputes_lost + 1 WHERE user_id = _disputer_id;
  END IF;
  
  -- Award points to correct voters
  FOR _vote IN SELECT * FROM public.dispute_votes WHERE dispute_id = _dispute_id LOOP
    UPDATE public.profiles SET total_votes = total_votes + 1 WHERE user_id = _vote.user_id;
    
    IF (_vote.vote_for_disputer = _winner_is_disputer) THEN
      PERFORM public.award_points(_vote.user_id, 10, 'correct_vote', _dispute_id);
      UPDATE public.profiles SET correct_votes = correct_votes + 1 WHERE user_id = _vote.user_id;
    ELSE
      PERFORM public.award_points(_vote.user_id, -5, 'incorrect_vote', _dispute_id);
    END IF;
  END LOOP;
  
  -- Update reputation tiers
  UPDATE public.profiles SET reputation_tier = 
    CASE 
      WHEN correct_votes >= 100 AND (correct_votes::float / NULLIF(total_votes, 0)) >= 0.8 THEN 'expert'
      WHEN correct_votes >= 50 AND (correct_votes::float / NULLIF(total_votes, 0)) >= 0.7 THEN 'trusted'
      WHEN correct_votes >= 20 AND (correct_votes::float / NULLIF(total_votes, 0)) >= 0.6 THEN 'contributor'
      WHEN total_votes >= 5 THEN 'member'
      ELSE 'newcomer'
    END
  WHERE user_id IN (SELECT user_id FROM public.dispute_votes WHERE dispute_id = _dispute_id)
     OR user_id = _disputer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update disputes RLS to allow public viewing of active disputes
DROP POLICY IF EXISTS "Users can view their disputes" ON public.disputes;
CREATE POLICY "Active disputes viewable by authenticated users"
ON public.disputes FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR status = 'pending'
);