-- Add location fields to profiles table
ALTER TABLE public.profiles ADD COLUMN country text;
ALTER TABLE public.profiles ADD COLUMN region text;
ALTER TABLE public.profiles ADD COLUMN district text;
ALTER TABLE public.profiles ADD COLUMN phone_number text;

-- Update schools table to include location fields
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS headmaster_name text;

-- Create staff table for auditors, operators, supervisors, agents
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL,
  email text NOT NULL,
  phone_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_admin uuid REFERENCES auth.users(id)
);

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Admins can manage staff" 
ON public.staff 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role));

CREATE POLICY "Staff can view their own data" 
ON public.staff 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role));

-- Create pending_orders table for temporary order storage
CREATE TABLE public.pending_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text NOT NULL UNIQUE,
  school_id uuid NOT NULL REFERENCES schools(id),
  school_name text NOT NULL,
  headmaster_name text NOT NULL,
  country text NOT NULL,
  region text NOT NULL,
  district text NOT NULL,
  total_students integer NOT NULL DEFAULT 0,
  total_dark_garments integer NOT NULL DEFAULT 0,
  total_light_garments integer NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  receipt_number text,
  receipt_image_url text,
  session_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  payment_verified boolean NOT NULL DEFAULT false,
  verification_attempts integer NOT NULL DEFAULT 0,
  last_verification_attempt timestamp with time zone
);

-- Enable RLS on pending_orders
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_orders
CREATE POLICY "School users can create pending orders" 
ON public.pending_orders 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'SCHOOL_USER'::user_role));

CREATE POLICY "School users can view their pending orders" 
ON public.pending_orders 
FOR SELECT 
USING (school_id IN (SELECT id FROM schools WHERE id = school_id) AND 
       (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'SCHOOL_USER'::user_role) OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role)));

CREATE POLICY "Admins can manage pending orders" 
ON public.pending_orders 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role));

-- Update orders table to include more details
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS school_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS headmaster_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_dark_garments integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_light_garments integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount decimal(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_image_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS session_data jsonb;

-- Create audit_sessions table for storing ongoing audits
CREATE TABLE public.audit_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  auditor_id text NOT NULL,
  auditor_user_id uuid NOT NULL REFERENCES auth.users(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  audit_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on audit_sessions
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_sessions
CREATE POLICY "Auditors can manage their audit sessions" 
ON public.audit_sessions 
FOR ALL 
USING (auditor_user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'::user_role));

-- Create trigger for updating timestamps
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pending_orders_updated_at
BEFORE UPDATE ON public.pending_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_sessions_updated_at
BEFORE UPDATE ON public.audit_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();