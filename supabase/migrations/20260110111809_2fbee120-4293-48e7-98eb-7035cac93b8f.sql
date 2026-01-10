-- Fix audit_reports RLS policies to include AUDITOR role

-- Update INSERT policy to include AUDITOR
DROP POLICY IF EXISTS "Auditors can create audit reports" ON public.audit_reports;

CREATE POLICY "Auditors can create audit reports" 
ON public.audit_reports 
FOR INSERT 
WITH CHECK (
  EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role]))
  )
);

-- Update SELECT policy to include AUDITOR
DROP POLICY IF EXISTS "Staff can view audit reports" ON public.audit_reports;

CREATE POLICY "Staff can view audit reports" 
ON public.audit_reports 
FOR SELECT 
USING (
  EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role]))
  )
);

-- Update UPDATE policy to include AUDITOR (so they can update their own reports)
DROP POLICY IF EXISTS "Admins can update audit reports" ON public.audit_reports;

CREATE POLICY "Staff can update audit reports" 
ON public.audit_reports 
FOR UPDATE 
USING (
  EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role]))
  )
);