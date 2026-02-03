-- Create direct messages table
CREATE TABLE public.direct_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    recipient_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies for direct messages
CREATE POLICY "Users can send messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Entity owners can view their messages"
ON public.direct_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.entities
        WHERE entities.id = direct_messages.recipient_entity_id
        AND entities.claimed_by = auth.uid()
    )
    OR sender_id = auth.uid()
);

CREATE POLICY "Entity owners can update message read status"
ON public.direct_messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.entities
        WHERE entities.id = direct_messages.recipient_entity_id
        AND entities.claimed_by = auth.uid()
    )
);

-- Create mutual verification table for profile linking
CREATE TABLE public.profile_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    verification_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    verified_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(requester_entity_id, target_entity_id)
);

-- Enable RLS
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Entity owners can request verification"
ON public.profile_verifications
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.entities
        WHERE entities.id = profile_verifications.requester_entity_id
        AND entities.claimed_by = auth.uid()
    )
);

CREATE POLICY "Entity owners can view their verifications"
ON public.profile_verifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.entities
        WHERE (entities.id = profile_verifications.requester_entity_id OR entities.id = profile_verifications.target_entity_id)
        AND entities.claimed_by = auth.uid()
    )
);

CREATE POLICY "Target entity owners can update verification"
ON public.profile_verifications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.entities
        WHERE entities.id = profile_verifications.target_entity_id
        AND entities.claimed_by = auth.uid()
    )
);

-- Add score_decay_date to entity_scores for tracking last activity
ALTER TABLE public.entity_scores ADD COLUMN IF NOT EXISTS last_review_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.entity_scores ADD COLUMN IF NOT EXISTS decay_applied BOOLEAN DEFAULT false;

-- Allow entity_scores to be updated for decay mechanism
CREATE POLICY "System can update scores for decay"
ON public.entity_scores
FOR UPDATE
USING (true);