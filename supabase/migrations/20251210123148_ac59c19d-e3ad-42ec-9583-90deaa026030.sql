-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', false);

-- Create table to track uploaded materials
CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_materials table
CREATE POLICY "Users can view their own materials"
ON public.study_materials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own materials"
ON public.study_materials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
ON public.study_materials
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for study-materials bucket
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);