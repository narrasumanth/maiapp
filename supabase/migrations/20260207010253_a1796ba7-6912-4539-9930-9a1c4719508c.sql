-- Add response deadline column for 48-hour response window
ALTER TABLE public.claim_disputes 
ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP WITH TIME ZONE;

-- Update existing pending disputes to have a deadline (48 hours from creation)
UPDATE public.claim_disputes 
SET response_deadline = created_at + INTERVAL '48 hours'
WHERE status = 'pending' AND response_deadline IS NULL;