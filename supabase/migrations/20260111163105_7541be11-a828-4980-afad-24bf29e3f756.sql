-- Fix waitlist_signups to require authentication for reading
DROP POLICY IF EXISTS "Anyone can view waitlist signups" ON public.waitlist_signups;
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.waitlist_signups;

-- Only allow authenticated users (admins) to read waitlist
CREATE POLICY "Only authenticated users can view waitlist"
ON public.waitlist_signups
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow anyone to insert (public signup form)
CREATE POLICY "Anyone can add to waitlist"
ON public.waitlist_signups
FOR INSERT
WITH CHECK (true);

-- Fix push_subscriptions - ensure only authenticated users can read their own
-- The existing policy should already require auth.uid() = user_id, but let's verify
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Authenticated users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);