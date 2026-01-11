-- Fix RLS policies for Auditor dashboard to allow full access to audit-related tables

-- ===========================================
-- ORDERS TABLE: Add UPDATE policy for AUDITOR
-- ===========================================
CREATE POLICY "Staff can update orders for auditing"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
  )
);

-- ===========================================
-- CLASSES TABLE: Add SELECT and UPDATE policies for AUDITOR
-- ===========================================
DROP POLICY IF EXISTS "Users can view classes" ON public.classes;

CREATE POLICY "Users can view classes"
ON public.classes
FOR SELECT
USING (
  (school_id = auth.uid()) 
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'SCHOOL_USER'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
    )
  )
);

CREATE POLICY "Staff can update classes"
ON public.classes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
  )
);

-- ===========================================
-- STUDENTS TABLE: Add SELECT and UPDATE policies for AUDITOR
-- ===========================================
DROP POLICY IF EXISTS "Users can view students" ON public.students;

CREATE POLICY "Users can view students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'SCHOOL_USER'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
  )
);

CREATE POLICY "Staff can update students"
ON public.students
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
  )
);

-- ===========================================
-- STUDENT_AUDITS TABLE: Add AUDITOR to INSERT and SELECT policies
-- ===========================================
DROP POLICY IF EXISTS "Auditors can create student audits" ON public.student_audits;

CREATE POLICY "Auditors can create student audits"
ON public.student_audits
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
  )
);

DROP POLICY IF EXISTS "Staff can view student audits" ON public.student_audits;

CREATE POLICY "Staff can view student audits"
ON public.student_audits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role])
  )
);