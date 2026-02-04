-- Add location tracking to search_history
ALTER TABLE public.search_history 
ADD COLUMN IF NOT EXISTS ip_hash text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_country ON public.search_history(country);

-- Create a view for search analytics (admin only)
CREATE OR REPLACE VIEW public.search_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  country,
  city,
  COUNT(*) as search_count,
  COUNT(DISTINCT ip_hash) as unique_visitors
FROM public.search_history
GROUP BY DATE_TRUNC('day', created_at), country, city
ORDER BY date DESC, search_count DESC;

-- Allow admins to view analytics
CREATE POLICY "Admins can view search analytics"
ON public.search_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing insert policy to allow location data
DROP POLICY IF EXISTS "Anyone can record searches" ON public.search_history;
CREATE POLICY "Anyone can record searches"
ON public.search_history
FOR INSERT
WITH CHECK (true);