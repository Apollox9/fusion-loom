-- Fix RLS policy for orders table to allow admins to insert orders
DROP POLICY IF EXISTS "School users can create orders" ON public.orders;

CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (created_by_user = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SCHOOL_USER'
  )) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);