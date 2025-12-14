-- Add category column to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'personal';

-- Add time column for display purposes (like "6:00 AM")
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS display_time text;