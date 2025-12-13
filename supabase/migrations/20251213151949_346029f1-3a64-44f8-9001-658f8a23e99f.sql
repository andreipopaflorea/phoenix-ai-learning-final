-- Add unique constraint on external_id for Google Calendar upserts
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_external_id_key UNIQUE (external_id);