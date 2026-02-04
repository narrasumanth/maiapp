-- Create event pulse feedback table for live audience interaction
CREATE TABLE public.event_pulses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roulette_id UUID REFERENCES public.custom_roulettes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  pulse_type TEXT NOT NULL CHECK (pulse_type IN ('excited', 'neutral', 'bored', 'suggestion')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_pulses ENABLE ROW LEVEL SECURITY;

-- Anyone can view pulses for events they're part of
CREATE POLICY "Users can view event pulses"
ON public.event_pulses
FOR SELECT
TO authenticated
USING (true);

-- Users can create pulses (one per type per event)
CREATE POLICY "Users can create pulses"
ON public.event_pulses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pulses
CREATE POLICY "Users can update own pulses"
ON public.event_pulses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own pulses
CREATE POLICY "Users can delete own pulses"
ON public.event_pulses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_pulses;

-- Add index for faster queries
CREATE INDEX idx_event_pulses_roulette ON public.event_pulses(roulette_id);
CREATE INDEX idx_event_pulses_created ON public.event_pulses(created_at DESC);