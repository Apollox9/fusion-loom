-- Add user_id to schools table to link schools to users
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add account_number field to payment_methods for copyable details
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_name text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schools_user_id ON public.schools(user_id);

-- Update RLS policies for schools to use user_id
DROP POLICY IF EXISTS "School users can view their school" ON public.schools;
CREATE POLICY "School users can view their school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'ADMIN'
  )
);