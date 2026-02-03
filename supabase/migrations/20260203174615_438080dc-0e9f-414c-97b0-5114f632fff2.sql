-- =============================================
-- COMPREHENSIVE SECURITY & FEATURE MIGRATION
-- =============================================

-- 1. Rate limiting tracking table
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP hash or user ID
    action_type TEXT NOT NULL, -- 'search', 'review', 'comment', 'message'
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    request_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(identifier, action_type, window_start)
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, action_type, window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only backend can manage rate limits
CREATE POLICY "System can manage rate limits" ON public.rate_limits FOR ALL USING (true);

-- 2. Disputes/Appeals table
CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('inaccurate_score', 'false_review', 'incorrect_info', 'impersonation', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    resolution_notes TEXT,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Users can create disputes
CREATE POLICY "Users can create disputes" ON public.disputes 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own disputes
CREATE POLICY "Users can view their disputes" ON public.disputes 
FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Admins/Mods can update disputes
CREATE POLICY "Admins can update disputes" ON public.disputes 
FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- 3. Private share links table
CREATE TABLE public.private_share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    access_token TEXT NOT NULL UNIQUE,
    access_level TEXT NOT NULL DEFAULT 'full' CHECK (access_level IN ('basic', 'detailed', 'full')),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_private_share_token ON public.private_share_links(access_token);

ALTER TABLE public.private_share_links ENABLE ROW LEVEL SECURITY;

-- Entity owners can manage their share links
CREATE POLICY "Owners can manage share links" ON public.private_share_links
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM entities 
        WHERE entities.id = private_share_links.entity_id 
        AND entities.claimed_by = auth.uid()
    )
);

-- Anyone can view active share links by token (for validation)
CREATE POLICY "Anyone can validate share links" ON public.private_share_links
FOR SELECT USING (is_active = true);

-- 4. API keys table for external integrations
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL, -- Hashed API key
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    permissions TEXT[] NOT NULL DEFAULT ARRAY['read'],
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their API keys" ON public.api_keys
FOR ALL USING (auth.uid() = user_id);

-- 5. API usage logs for billing/analytics
CREATE TABLE public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    response_code INTEGER,
    response_time_ms INTEGER,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their API usage" ON public.api_usage_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM api_keys 
        WHERE api_keys.id = api_usage_logs.api_key_id 
        AND api_keys.user_id = auth.uid()
    )
);

CREATE POLICY "System can create usage logs" ON public.api_usage_logs
FOR INSERT WITH CHECK (true);

-- 6. Add privacy settings to entities
ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'limited', 'private'));

ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS hidden_fields TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 7. Bot detection honeypot tracking
CREATE TABLE public.honeypot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    triggered_field TEXT,
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.honeypot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can log honeypots" ON public.honeypot_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view honeypot logs" ON public.honeypot_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 8. Blocked IPs table
CREATE TABLE public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 9. Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    _identifier TEXT,
    _action_type TEXT,
    _max_requests INTEGER,
    _window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _window_start TIMESTAMP WITH TIME ZONE;
    _current_count INTEGER;
BEGIN
    _window_start := date_trunc('minute', now()) - (extract(minute FROM now())::integer % _window_minutes) * interval '1 minute';
    
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (identifier, action_type, window_start, request_count)
    VALUES (_identifier, _action_type, _window_start, 1)
    ON CONFLICT (identifier, action_type, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO _current_count;
    
    RETURN _current_count <= _max_requests;
END;
$$;

-- 10. Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$;

-- 11. Add trigger for disputes updated_at
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();