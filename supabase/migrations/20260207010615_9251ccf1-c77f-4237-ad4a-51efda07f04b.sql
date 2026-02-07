-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Create a function to call the jackpot-draw edge function
CREATE OR REPLACE FUNCTION public.trigger_jackpot_draw()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Call the edge function using http extension
  SELECT content::json INTO result
  FROM extensions.http((
    'POST',
    current_setting('app.supabase_url') || '/functions/v1/jackpot-draw',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  
  RAISE LOG 'Jackpot draw triggered: %', result;
END;
$$;

-- Schedule the jackpot draw to run at the top of every hour
SELECT cron.schedule(
  'hourly-jackpot-draw',
  '0 * * * *', -- At minute 0 of every hour
  'SELECT public.trigger_jackpot_draw()'
);