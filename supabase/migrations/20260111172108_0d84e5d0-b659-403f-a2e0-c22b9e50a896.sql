-- Create interests table for personal curiosities
CREATE TABLE public.interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interests
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- RLS policies for interests
CREATE POLICY "Users can view their own interests" 
ON public.interests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interests" 
ON public.interests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests" 
ON public.interests FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" 
ON public.interests FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for interests updated_at
CREATE TRIGGER update_interests_updated_at
BEFORE UPDATE ON public.interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create inspiration table for uploaded files/articles
CREATE TABLE public.inspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  content_summary TEXT,
  hidden_insight TEXT,
  connected_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  insight_strength INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on inspirations
ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;

-- RLS policies for inspirations
CREATE POLICY "Users can view their own inspirations" 
ON public.inspirations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inspirations" 
ON public.inspirations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspirations" 
ON public.inspirations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspirations" 
ON public.inspirations FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for inspirations updated_at
CREATE TRIGGER update_inspirations_updated_at
BEFORE UPDATE ON public.inspirations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for inspiration files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inspiration', 'inspiration', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for inspiration bucket
CREATE POLICY "Users can view their own inspiration files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'inspiration' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own inspiration files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'inspiration' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own inspiration files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'inspiration' AND auth.uid()::text = (storage.foldername(name))[1]);