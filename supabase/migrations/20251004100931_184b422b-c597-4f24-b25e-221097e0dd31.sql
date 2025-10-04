-- Fix RLS policies for pending_orders table
DROP POLICY IF EXISTS "School users can create pending orders" ON public.pending_orders;

CREATE POLICY "School users can create pending orders" 
ON public.pending_orders 
FOR INSERT 
WITH CHECK (
  school_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'SCHOOL_USER'
  )
);

-- Allow school users to view their own pending orders
CREATE POLICY "School users can view their pending orders"
ON public.pending_orders
FOR SELECT
USING (
  school_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SCHOOL_USER'
  )
);

-- Fix RLS policies for classes table to allow school users to insert
DROP POLICY IF EXISTS "Users can view classes" ON public.classes;

CREATE POLICY "School users can insert classes"
ON public.classes
FOR INSERT
WITH CHECK (
  school_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('SCHOOL_USER', 'ADMIN')
  )
);

CREATE POLICY "Users can view classes"
ON public.classes
FOR SELECT
USING (
  school_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ADMIN', 'SCHOOL_USER', 'OPERATOR', 'SUPERVISOR')
  )
);

-- Fix RLS policies for students table
CREATE POLICY "School users can insert students"
ON public.students
FOR INSERT
WITH CHECK (
  school_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('SCHOOL_USER', 'ADMIN')
  )
);

-- Fix RLS policies for schools table
CREATE POLICY "School users can insert schools"
ON public.schools
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SCHOOL_USER'
  )
);

CREATE POLICY "School users can update their schools"
ON public.schools
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SCHOOL_USER'
  )
);

-- Allow profiles to be inserted by the trigger
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow trigger to insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);