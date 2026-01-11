-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'reading_writing', 'kinesthetic')),
  color TEXT DEFAULT 'orange',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create goal_materials junction table
CREATE TABLE public.goal_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(goal_id, study_material_id)
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_materials ENABLE ROW LEVEL SECURITY;

-- Goals RLS policies
CREATE POLICY "Users can view their own goals"
ON public.goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
ON public.goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON public.goals FOR DELETE
USING (auth.uid() = user_id);

-- Goal materials RLS policies (user must own the goal)
CREATE POLICY "Users can view materials for their goals"
ON public.goal_materials FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.goals WHERE goals.id = goal_materials.goal_id AND goals.user_id = auth.uid()
));

CREATE POLICY "Users can add materials to their goals"
ON public.goal_materials FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.goals WHERE goals.id = goal_materials.goal_id AND goals.user_id = auth.uid()
));

CREATE POLICY "Users can remove materials from their goals"
ON public.goal_materials FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.goals WHERE goals.id = goal_materials.goal_id AND goals.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();