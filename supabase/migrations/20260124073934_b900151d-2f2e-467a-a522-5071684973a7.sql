-- Allow unauthenticated users to insert schools during signup
DROP POLICY IF EXISTS "School users can insert schools" ON public.schools;
CREATE POLICY "Anyone can insert schools during signup"
ON public.schools
FOR INSERT
WITH CHECK (true);

-- Allow unauthenticated users to delete their unconfirmed schools
DROP POLICY IF EXISTS "Users can delete unconfirmed schools" ON public.schools;
CREATE POLICY "Anyone can delete unconfirmed schools"
ON public.schools
FOR DELETE
USING (status = 'unconfirmed');

-- Allow unauthenticated users to view schools by email for duplicate check
CREATE POLICY "Anyone can check school email during signup"
ON public.schools
FOR SELECT
USING (true);

-- Allow anyone to update invitational codes (for marking as used during signup)
DROP POLICY IF EXISTS "Anyone can update codes during signup" ON public.agent_invitational_codes;
CREATE POLICY "Anyone can update codes during signup"
ON public.agent_invitational_codes
FOR UPDATE
USING (true)
WITH CHECK (true);