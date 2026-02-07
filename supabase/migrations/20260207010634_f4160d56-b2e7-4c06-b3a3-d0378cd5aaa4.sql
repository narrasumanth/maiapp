-- Enable realtime for hourly_draws table for live winner announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.hourly_draws;