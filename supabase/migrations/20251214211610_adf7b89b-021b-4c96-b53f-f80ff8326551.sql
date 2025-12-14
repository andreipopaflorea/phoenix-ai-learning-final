-- Create table to track flashcard review progress using spaced repetition
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  next_review_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- Enable Row Level Security
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own flashcard reviews"
ON public.flashcard_reviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard reviews"
ON public.flashcard_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard reviews"
ON public.flashcard_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient querying of due cards
CREATE INDEX idx_flashcard_reviews_due ON public.flashcard_reviews(user_id, next_review_at);