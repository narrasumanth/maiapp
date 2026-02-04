-- Add columns for guest participants (no signup required)
ALTER TABLE public.roulette_participants 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Make user_id nullable for guest participants
ALTER TABLE public.roulette_participants 
ALTER COLUMN user_id DROP NOT NULL;

-- Add status column to custom_roulettes for cancelled events
ALTER TABLE public.custom_roulettes 
DROP CONSTRAINT IF EXISTS custom_roulettes_status_check;

-- Add a unique constraint to prevent duplicate guest entries by email per roulette
CREATE UNIQUE INDEX IF NOT EXISTS roulette_participants_guest_email_unique 
ON public.roulette_participants (roulette_id, email) 
WHERE email IS NOT NULL AND is_guest = true;

-- Update RLS policy to allow guests to insert themselves
DROP POLICY IF EXISTS "Guests can join roulettes" ON public.roulette_participants;
CREATE POLICY "Guests can join roulettes" 
ON public.roulette_participants 
FOR INSERT 
WITH CHECK (
  is_guest = true OR auth.uid() = user_id
);

-- Allow reading participants (for host and participants)
DROP POLICY IF EXISTS "Anyone can view roulette participants" ON public.roulette_participants;
CREATE POLICY "Anyone can view roulette participants" 
ON public.roulette_participants 
FOR SELECT 
USING (true);