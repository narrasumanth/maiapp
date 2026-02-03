-- Fix overly permissive RLS policies

-- Drop and recreate user_points policies to be more restrictive
DROP POLICY IF EXISTS "System can manage points" ON public.user_points;
CREATE POLICY "Points managed via security definer" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Points updated via security definer" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);

-- Drop and recreate hashtags policies  
DROP POLICY IF EXISTS "System can manage hashtags" ON public.hashtags;
CREATE POLICY "Authenticated users can create hashtags" ON public.hashtags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix post_hashtags policy
DROP POLICY IF EXISTS "Users can manage their post hashtags" ON public.post_hashtags;
CREATE POLICY "Users can insert their post hashtags" ON public.post_hashtags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their post hashtags" ON public.post_hashtags FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Fix entity_social_links policy
DROP POLICY IF EXISTS "Entity owners can manage social links" ON public.entity_social_links;
CREATE POLICY "Entity owners can insert social links" ON public.entity_social_links FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND claimed_by = auth.uid())
);
CREATE POLICY "Entity owners can update social links" ON public.entity_social_links FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND claimed_by = auth.uid())
);
CREATE POLICY "Entity owners can delete social links" ON public.entity_social_links FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND claimed_by = auth.uid())
);