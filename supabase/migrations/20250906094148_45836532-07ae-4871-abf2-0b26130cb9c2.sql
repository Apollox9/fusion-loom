-- Add location fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Update schools table to include location fields
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS headmaster_name text;

-- Create staff table for auditors, operators, supervisors, agents
CREATE TABLE IF NOT EXISTS public.staff (
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
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text NOT NULL UNIQUE,
  school_id uuid NOT NULL,
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