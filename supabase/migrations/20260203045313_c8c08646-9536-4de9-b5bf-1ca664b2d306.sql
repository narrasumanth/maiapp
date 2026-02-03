-- Create profiles table for user verification and tracking
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  twitter_verified BOOLEAN DEFAULT false,
  linkedin_verified BOOLEAN DEFAULT false,
  verification_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create entities table to store searched items
CREATE TABLE public.entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Person', 'Place', 'Product', 'Business')),
  normalized_name TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scores table to track score history
CREATE TABLE public.entity_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  vibe_check TEXT,
  summary TEXT,
  evidence JSONB DEFAULT '[]',
  reviews_analyzed INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 1,
  positive_reactions INTEGER DEFAULT 0,
  negative_reactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table for verified user reviews
CREATE TABLE public.entity_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_positive BOOLEAN NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_id, user_id)
);

-- Create comments table
CREATE TABLE public.entity_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reactions table for emoji reactions
CREATE TABLE public.entity_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'fire', 'angry', 'warning', 'heart', 'thinking', 'trophy')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_id, user_id, reaction_type)
);

-- Create search history table
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ASK MAI conversations table
CREATE TABLE public.mai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_entities_normalized_name ON public.entities(normalized_name);
CREATE INDEX idx_entity_scores_entity_id ON public.entity_scores(entity_id);
CREATE INDEX idx_entity_reviews_entity_id ON public.entity_reviews(entity_id);
CREATE INDEX idx_entity_comments_entity_id ON public.entity_comments(entity_id);
CREATE INDEX idx_search_history_query ON public.search_history(query);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Entities policies (public read, service role write)
CREATE POLICY "Entities are viewable by everyone" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create entities" ON public.entities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update entities" ON public.entities FOR UPDATE TO authenticated USING (true);

-- Entity scores policies
CREATE POLICY "Scores are viewable by everyone" ON public.entity_scores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create scores" ON public.entity_scores FOR INSERT TO authenticated WITH CHECK (true);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.entity_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.entity_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.entity_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.entity_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.entity_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.entity_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.entity_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" ON public.entity_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions" ON public.entity_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.entity_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Search history policies
CREATE POLICY "Search history is viewable by everyone" ON public.search_history FOR SELECT USING (true);
CREATE POLICY "Anyone can add search history" ON public.search_history FOR INSERT WITH CHECK (true);

-- MAI conversations policies
CREATE POLICY "MAI conversations are viewable by everyone" ON public.mai_conversations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create conversations" ON public.mai_conversations FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_reactions;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email_verified)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();