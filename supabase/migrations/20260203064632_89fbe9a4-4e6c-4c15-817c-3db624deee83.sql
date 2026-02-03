-- Add notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'score_change', 'new_follower', 'message', 'profile_visit'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add page visits tracking table
CREATE TABLE public.entity_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  visitor_id UUID, -- nullable for anonymous visitors
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT -- anonymized tracking
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_visits ENABLE ROW LEVEL SECURITY;

-- Notifications RLS
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Entity visits RLS
CREATE POLICY "Anyone can record visits"
ON public.entity_visits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Entity owners can view their visits"
ON public.entity_visits FOR SELECT
USING (EXISTS (
  SELECT 1 FROM entities
  WHERE entities.id = entity_visits.entity_id
  AND entities.claimed_by = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_entity_visits_entity_id ON public.entity_visits(entity_id);
CREATE INDEX idx_entity_visits_visited_at ON public.entity_visits(visited_at DESC);

-- Add user trust score to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_verifications INTEGER DEFAULT 0;