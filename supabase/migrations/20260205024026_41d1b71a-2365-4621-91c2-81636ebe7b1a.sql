-- Fix security issue: search_history table should not be publicly readable
-- It contains IP hashes, user agents, and location data which is sensitive

-- Drop any existing public SELECT policies on search_history
DROP POLICY IF EXISTS "Anyone can view search history" ON public.search_history;
DROP POLICY IF EXISTS "Public can view search history" ON public.search_history;
DROP POLICY IF EXISTS "Search history is publicly readable" ON public.search_history;

-- Create proper RLS policies for search_history
-- Users can only view their own search history (if authenticated)
CREATE POLICY "Users can view their own search history"
ON public.search_history
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all search history for analytics
CREATE POLICY "Admins can view all search history"
ON public.search_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System/Edge functions can insert search history (for logging purposes)
-- Keep existing INSERT policy or create one
DROP POLICY IF EXISTS "Anyone can insert search history" ON public.search_history;
DROP POLICY IF EXISTS "System can log searches" ON public.search_history;

CREATE POLICY "System can log searches"
ON public.search_history
FOR INSERT
WITH CHECK (true);

-- Fix security issue: roulette_participants should not expose guest emails and device fingerprints publicly
-- Only host and participants themselves should see full details

-- Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can view participants" ON public.roulette_participants;
DROP POLICY IF EXISTS "Anyone can view roulette participants" ON public.roulette_participants;

-- Create restricted SELECT policy: 
-- - Participants can see their own data
-- - Hosts can see participants of their roulettes
-- - For public visibility, only show display_name and is_winner (not email/device_fingerprint)
CREATE POLICY "Hosts and participants can view full participant data"
ON public.roulette_participants
FOR SELECT
USING (
  -- User is the participant themselves
  (auth.uid() = user_id)
  OR
  -- User is the host of the roulette
  EXISTS (
    SELECT 1 FROM custom_roulettes cr
    WHERE cr.id = roulette_participants.roulette_id
    AND cr.host_id = auth.uid()
  )
  OR
  -- Admins can view all
  has_role(auth.uid(), 'admin')
);

-- Create a secure view for public participant display (shows only safe fields)
CREATE OR REPLACE VIEW public.roulette_participants_public
WITH (security_invoker = on) AS
SELECT 
  id,
  roulette_id,
  display_name,
  is_winner,
  joined_at,
  is_guest
FROM public.roulette_participants;

-- Grant SELECT on the public view
GRANT SELECT ON public.roulette_participants_public TO anon, authenticated;