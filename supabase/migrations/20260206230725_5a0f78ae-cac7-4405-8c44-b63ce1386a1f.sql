-- Add new profile fields for claimed entities
ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.entities.contact_phone IS 'Optional contact phone number';
COMMENT ON COLUMN public.entities.location IS 'Optional location/address';
COMMENT ON COLUMN public.entities.social_links IS 'Array of social media links (max 3), format: [{platform: string, url: string}]';