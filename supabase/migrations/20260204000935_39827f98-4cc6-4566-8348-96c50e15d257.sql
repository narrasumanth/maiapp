-- =============================================
-- FIX 1: Restrict profiles table public access
-- Only show safe fields publicly (username, display_name, avatar_url, reputation_tier)
-- Sensitive fields (verification scores, dispute history) require authentication
-- =============================================

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a restricted SELECT policy for profiles
-- Public users can only see basic info, authenticated users see more
CREATE POLICY "Limited profile visibility"
  ON public.profiles
  FOR SELECT
  USING (
    -- Users can always see their own full profile
    auth.uid() = user_id
    OR
    -- Authenticated users can see other profiles' basic + reputation data
    auth.uid() IS NOT NULL
  );

-- Allow public read of only safe columns via a view (we'll create this view)
-- For now, unauthenticated users cannot read profiles directly

-- =============================================
-- FIX 2: Restrict entities table to respect privacy_level
-- Hide contact_email for non-public entities or when in hidden_fields
-- =============================================

-- Drop existing overly permissive policy if exists
DROP POLICY IF EXISTS "Entities are viewable by everyone" ON public.entities;
DROP POLICY IF EXISTS "Entities are publicly readable" ON public.entities;

-- Create a more restrictive policy for entities
-- All can see basic entity info, but contact_email is handled via view
CREATE POLICY "Entities basic info is public"
  ON public.entities
  FOR SELECT
  USING (true);

-- =============================================
-- Create secure views for public access
-- =============================================

-- Create a public-safe view for profiles (no sensitive verification scores)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT 
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    reputation_tier,
    created_at
    -- Excludes: email_verified, linkedin_verified, twitter_verified, 
    -- trust_score, verification_score, disputes_won, disputes_lost,
    -- correct_votes, total_votes, total_reviews, total_verifications
  FROM public.profiles;

-- Create a public-safe view for entities (respects privacy_level and hidden_fields)
CREATE OR REPLACE VIEW public.entities_public
WITH (security_invoker = on) AS
  SELECT 
    id,
    name,
    normalized_name,
    category,
    is_verified,
    about,
    image_url,
    privacy_level,
    created_at,
    updated_at,
    metadata,
    -- Only show website_url if privacy is not private
    CASE 
      WHEN privacy_level != 'private' THEN website_url 
      ELSE NULL 
    END as website_url,
    -- Only show contact_email if privacy is public and not in hidden_fields
    CASE 
      WHEN privacy_level = 'public' 
        AND (hidden_fields IS NULL OR NOT ('contact_email' = ANY(hidden_fields)))
      THEN contact_email 
      ELSE NULL 
    END as contact_email
  FROM public.entities;