-- Add fun_fact and hard_fact columns to entity_score_cache
ALTER TABLE public.entity_score_cache
ADD COLUMN fun_fact TEXT,
ADD COLUMN hard_fact TEXT;