-- Create table for generic node connections (interests connecting to anything)
CREATE TABLE public.node_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('goal', 'interest', 'inspiration')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('goal', 'interest', 'inspiration')),
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate connections (both directions)
  UNIQUE (user_id, source_type, source_id, target_type, target_id)
);

-- Enable RLS
ALTER TABLE public.node_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own node connections" 
ON public.node_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own node connections" 
ON public.node_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own node connections" 
ON public.node_connections FOR DELETE 
USING (auth.uid() = user_id);