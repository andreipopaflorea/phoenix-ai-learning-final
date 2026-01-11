-- Create junction table for multiple inspiration-goal connections
CREATE TABLE public.inspiration_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspiration_id UUID NOT NULL REFERENCES public.inspirations(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  insight_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  UNIQUE(inspiration_id, goal_id)
);

-- Enable RLS
ALTER TABLE public.inspiration_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own connections" 
ON public.inspiration_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections" 
ON public.inspiration_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" 
ON public.inspiration_connections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" 
ON public.inspiration_connections FOR DELETE 
USING (auth.uid() = user_id);