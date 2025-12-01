-- Fix RLS policy for orders table to allow school users to view their school's orders
-- The issue is that created_by_school is a school UUID, not a user UUID
-- We need to check if the user belongs to the school via the schools.user_id column

DROP POLICY IF EXISTS "Users can view orders for their school" ON public.orders;

CREATE POLICY "Users can view orders for their school"
ON public.orders
FOR SELECT
USING (
  -- Allow if user created the order directly
  created_by_user = auth.uid() 
  OR 
  -- Allow if user belongs to the school that created the order
  EXISTS (
    SELECT 1 FROM public.schools 
    WHERE schools.id = orders.created_by_school 
    AND schools.user_id = auth.uid()
  )
  OR 
  -- Allow staff members
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'OPERATOR', 'SUPERVISOR')
  )
);