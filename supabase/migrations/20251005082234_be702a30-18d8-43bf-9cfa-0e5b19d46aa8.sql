-- Fix RLS policy for user_roles to allow admin to create staff roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Also ensure profiles table allows inserts via trigger for new staff
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.profiles;

CREATE POLICY "Allow trigger to insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);