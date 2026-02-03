-- Table for the hourly jackpot draws
CREATE TABLE public.hourly_draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    winner_id UUID REFERENCES auth.users(id),
    prize_amount INTEGER NOT NULL DEFAULT 5000,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for hourly jackpot participants (resets each hour)
CREATE TABLE public.hourly_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    hour_slot TIMESTAMP WITH TIME ZONE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    device_fingerprint TEXT,
    UNIQUE(user_id, hour_slot)
);

-- Table for custom roulette events
CREATE TABLE public.custom_roulettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    winners_count INTEGER DEFAULT 1,
    access_code TEXT UNIQUE NOT NULL,
    timer_seconds INTEGER DEFAULT 120,
    min_score_requirement INTEGER DEFAULT 0,
    geo_lock_enabled BOOLEAN DEFAULT false,
    geo_latitude DECIMAL,
    geo_longitude DECIMAL,
    geo_radius_meters INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table for custom roulette participants
CREATE TABLE public.roulette_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roulette_id UUID NOT NULL REFERENCES public.custom_roulettes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_winner BOOLEAN DEFAULT false,
    device_fingerprint TEXT,
    UNIQUE(roulette_id, user_id)
);

-- Table for winner badges (24-hour badge for jackpot winners)
CREATE TABLE public.winner_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_type TEXT NOT NULL DEFAULT 'jackpot_winner',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
    draw_id UUID REFERENCES public.hourly_draws(id)
);

-- Enable RLS on all tables
ALTER TABLE public.hourly_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roulettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hourly_draws
CREATE POLICY "Anyone can view draws" ON public.hourly_draws FOR SELECT USING (true);
CREATE POLICY "System can insert draws" ON public.hourly_draws FOR INSERT WITH CHECK (true);

-- RLS Policies for hourly_pool
CREATE POLICY "Users can view pool" ON public.hourly_pool FOR SELECT USING (true);
CREATE POLICY "Users can join pool" ON public.hourly_pool FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave pool" ON public.hourly_pool FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for custom_roulettes
CREATE POLICY "Anyone can view open roulettes" ON public.custom_roulettes FOR SELECT USING (true);
CREATE POLICY "Users can create roulettes" ON public.custom_roulettes FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their roulettes" ON public.custom_roulettes FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their roulettes" ON public.custom_roulettes FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for roulette_participants
CREATE POLICY "Anyone can view participants" ON public.roulette_participants FOR SELECT USING (true);
CREATE POLICY "Users can join roulettes" ON public.roulette_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update winners" ON public.roulette_participants FOR UPDATE USING (true);

-- RLS Policies for winner_badges
CREATE POLICY "Anyone can view badges" ON public.winner_badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON public.winner_badges FOR INSERT WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.hourly_pool;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_roulettes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roulette_participants;

-- Index for fast pool queries
CREATE INDEX idx_hourly_pool_hour ON public.hourly_pool(hour_slot);
CREATE INDEX idx_roulette_participants_roulette ON public.roulette_participants(roulette_id);
CREATE INDEX idx_winner_badges_user ON public.winner_badges(user_id, expires_at);