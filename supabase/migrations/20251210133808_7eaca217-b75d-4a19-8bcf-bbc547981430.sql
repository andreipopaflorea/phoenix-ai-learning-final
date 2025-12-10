-- Learning units (chunks from PDFs)
CREATE TABLE public.learning_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  unit_title TEXT NOT NULL,
  description TEXT,
  text TEXT NOT NULL,
  estimated_minutes INTEGER DEFAULT 5,
  unit_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_units
CREATE POLICY "Users can view their own learning units"
ON public.learning_units FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning units"
ON public.learning_units FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning units"
ON public.learning_units FOR DELETE
USING (auth.uid() = user_id);

-- User progress tracking (complete vs mastered)
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  learning_unit_id UUID REFERENCES public.learning_units(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  tier1_completed_at TIMESTAMPTZ,
  tier2_completed_at TIMESTAMPTZ,
  tier3_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, learning_unit_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_progress
CREATE POLICY "Users can view their own progress"
ON public.user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Session content (generated on-demand per tier)
CREATE TABLE public.session_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_unit_id UUID REFERENCES public.learning_units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  learning_style learning_style NOT NULL,
  tier INTEGER NOT NULL,
  content_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(learning_unit_id, user_id, learning_style, tier)
);

-- Enable RLS
ALTER TABLE public.session_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_content
CREATE POLICY "Users can view their own session content"
ON public.session_content FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session content"
ON public.session_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Calendar events (manual + synced)
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_synced BOOLEAN DEFAULT false,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events"
ON public.calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events"
ON public.calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
ON public.calendar_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
ON public.calendar_events FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on user_progress
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();