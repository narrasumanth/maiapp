-- Create claim disputes table with proper security
CREATE TABLE public.claim_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    challenger_id UUID NOT NULL,  -- User trying to claim
    current_owner_id UUID NOT NULL,  -- Current claimed_by user
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'challenger_wins', 'owner_wins', 'dismissed')),
    challenger_reason TEXT NOT NULL,
    challenger_evidence_urls TEXT[] DEFAULT '{}',
    owner_response TEXT,
    owner_evidence_urls TEXT[] DEFAULT '{}',
    admin_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(entity_id, challenger_id, status) -- Prevent duplicate pending disputes
);

-- Enable RLS
ALTER TABLE public.claim_disputes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own disputes (as challenger or owner)
CREATE POLICY "Users can view their own disputes"
ON public.claim_disputes FOR SELECT
USING (
    auth.uid() = challenger_id 
    OR auth.uid() = current_owner_id 
    OR public.has_role(auth.uid(), 'admin')
);

-- Policy: Users can create disputes (as challenger)
CREATE POLICY "Users can create disputes"
ON public.claim_disputes FOR INSERT
WITH CHECK (auth.uid() = challenger_id);

-- Policy: Participants can update their own evidence
CREATE POLICY "Participants can update own evidence"
ON public.claim_disputes FOR UPDATE
USING (
    (auth.uid() = challenger_id AND status = 'pending')
    OR (auth.uid() = current_owner_id AND status = 'pending')
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    (auth.uid() = challenger_id AND status = 'pending')
    OR (auth.uid() = current_owner_id AND status = 'pending')
    OR public.has_role(auth.uid(), 'admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_claim_disputes_updated_at
BEFORE UPDATE ON public.claim_disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_claim_disputes_challenger ON public.claim_disputes(challenger_id);
CREATE INDEX idx_claim_disputes_owner ON public.claim_disputes(current_owner_id);
CREATE INDEX idx_claim_disputes_entity ON public.claim_disputes(entity_id);
CREATE INDEX idx_claim_disputes_status ON public.claim_disputes(status);