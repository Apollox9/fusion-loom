-- Update RLS policy on orders table to include AUDITOR role
DROP POLICY IF EXISTS "Users can view orders for their school" ON public.orders;

CREATE POLICY "Users can view orders for their school" 
ON public.orders 
FOR SELECT 
USING (
  (created_by_user = auth.uid()) 
  OR (EXISTS ( 
    SELECT 1 FROM schools 
    WHERE (schools.id = orders.created_by_school) AND (schools.user_id = auth.uid())
  )) 
  OR (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role]))
  ))
);

-- Also update staff table RLS to allow auditors to view staff records for validation
DROP POLICY IF EXISTS "Staff can view staff records" ON public.staff;

CREATE POLICY "Staff can view staff records" 
ON public.staff 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'OPERATOR'::user_role, 'SUPERVISOR'::user_role, 'AUDITOR'::user_role]))
  ))
);