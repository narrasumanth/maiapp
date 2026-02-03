-- Add new columns to entities table for profile claiming
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id);
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS website_url text;

-- Social links table for entities
CREATE TABLE public.entity_social_links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    platform text NOT NULL, -- twitter, instagram, linkedin, facebook, youtube, tiktok, custom
    url text NOT NULL,
    is_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- User points/activity tracking
CREATE TABLE public.user_points (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points integer DEFAULT 0 NOT NULL,
    total_earned integer DEFAULT 0 NOT NULL,
    total_redeemed integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- Points history/transactions
CREATE TABLE public.points_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount integer NOT NULL, -- positive for earn, negative for redeem
    action_type text NOT NULL, -- review, comment, follow, daily_login, redeem_claim, redeem_boost
    reference_id uuid, -- optional reference to related entity
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Follow system
CREATE TABLE public.entity_follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, entity_id)
);

-- Profile claims requests
CREATE TABLE public.profile_claims (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
    verification_method text, -- social_proof, domain, manual
    verification_data jsonb,
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(entity_id, user_id)
);

-- Posts/feed system
CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
    content text NOT NULL,
    is_vetted boolean DEFAULT false,
    vetted_by_ai boolean DEFAULT false,
    vetted_by_user uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Hashtags
CREATE TABLE public.hashtags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tag text NOT NULL UNIQUE,
    post_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Post-hashtag junction
CREATE TABLE public.post_hashtags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    UNIQUE(post_id, hashtag_id)
);

-- User roles (for admin/moderator access)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Enable RLS on all new tables
ALTER TABLE public.entity_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Entity Social Links
CREATE POLICY "Social links viewable by everyone" ON public.entity_social_links FOR SELECT USING (true);
CREATE POLICY "Entity owners can manage social links" ON public.entity_social_links FOR ALL USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND claimed_by = auth.uid())
);

-- User Points
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage points" ON public.user_points FOR ALL USING (true);

-- Points Transactions
CREATE POLICY "Users can view their own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON public.points_transactions FOR INSERT WITH CHECK (true);

-- Entity Follows
CREATE POLICY "Follows viewable by everyone" ON public.entity_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON public.entity_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow" ON public.entity_follows FOR DELETE USING (auth.uid() = user_id);

-- Profile Claims
CREATE POLICY "Users can view their own claims" ON public.profile_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all claims" ON public.profile_claims FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create claims" ON public.profile_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update claims" ON public.profile_claims FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Posts
CREATE POLICY "Vetted posts viewable by everyone" ON public.posts FOR SELECT USING (is_vetted = true);
CREATE POLICY "Users can view their own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Hashtags
CREATE POLICY "Hashtags viewable by everyone" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "System can manage hashtags" ON public.hashtags FOR ALL USING (true);

-- Post Hashtags
CREATE POLICY "Post hashtags viewable by everyone" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Users can manage their post hashtags" ON public.post_hashtags FOR ALL USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- User Roles (only admins can see/manage)
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_points_updated_at
    BEFORE UPDATE ON public.user_points
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to award points
CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _amount integer, _action_type text, _reference_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert or update user_points
    INSERT INTO public.user_points (user_id, points, total_earned)
    VALUES (_user_id, _amount, GREATEST(_amount, 0))
    ON CONFLICT (user_id) DO UPDATE SET
        points = user_points.points + _amount,
        total_earned = CASE WHEN _amount > 0 THEN user_points.total_earned + _amount ELSE user_points.total_earned END,
        total_redeemed = CASE WHEN _amount < 0 THEN user_points.total_redeemed + ABS(_amount) ELSE user_points.total_redeemed END,
        updated_at = now();
    
    -- Record transaction
    INSERT INTO public.points_transactions (user_id, amount, action_type, reference_id)
    VALUES (_user_id, _amount, _action_type, _reference_id);
END;
$$;