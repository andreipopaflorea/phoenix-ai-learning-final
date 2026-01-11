-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert sent notifications" ON public.sent_notifications;

-- Create a proper policy that checks user_id
CREATE POLICY "Users can insert their own sent notifications"
ON public.sent_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);