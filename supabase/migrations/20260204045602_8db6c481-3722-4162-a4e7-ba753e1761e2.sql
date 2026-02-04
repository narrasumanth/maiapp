-- Add new profile fields for enhanced verification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS email_subscription BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.first_name IS 'User first name for profile claims';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name for profile claims';
COMMENT ON COLUMN public.profiles.middle_name IS 'Optional middle name';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Whether phone has been verified';
COMMENT ON COLUMN public.profiles.location IS 'City/Place of user';
COMMENT ON COLUMN public.profiles.country IS 'Country of user';
COMMENT ON COLUMN public.profiles.email_subscription IS 'Email marketing subscription status';