-- Create learning style enum
CREATE TYPE public.learning_style AS ENUM ('visual', 'auditory', 'reading_writing', 'kinesthetic');

-- Create user learning preferences table
CREATE TABLE public.user_learning_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  learning_style learning_style NOT NULL DEFAULT 'visual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_learning_preferences
CREATE POLICY "Users can view their own learning preferences"
ON public.user_learning_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning preferences"
ON public.user_learning_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning preferences"
ON public.user_learning_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create micro_lessons table
CREATE TABLE public.micro_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  summary TEXT NOT NULL,
  lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_style learning_style NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.micro_lessons ENABLE ROW LEVEL SECURITY;

-- RLS policies for micro_lessons
CREATE POLICY "Users can view their own micro lessons"
ON public.micro_lessons
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own micro lessons"
ON public.micro_lessons
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own micro lessons"
ON public.micro_lessons
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on user_learning_preferences
CREATE TRIGGER update_user_learning_preferences_updated_at
BEFORE UPDATE ON public.user_learning_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();