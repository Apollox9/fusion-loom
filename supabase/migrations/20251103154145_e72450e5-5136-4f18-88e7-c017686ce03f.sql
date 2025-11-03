-- Add format_staff_name function to format full names to title case
CREATE OR REPLACE FUNCTION public.format_staff_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Format full_name to title case
  NEW.full_name := INITCAP(LOWER(NEW.full_name));
  RETURN NEW;
END;
$$;

-- Add trigger to staff table
DROP TRIGGER IF EXISTS trigger_format_staff_name ON public.staff;
CREATE TRIGGER trigger_format_staff_name
BEFORE INSERT OR UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.format_staff_name();

-- Add session_id to students table (links to orders)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

-- Rename garment count columns in students for consistency
ALTER TABLE public.students
RENAME COLUMN total_light_garment_count TO light_garment_count;

ALTER TABLE public.students
RENAME COLUMN total_dark_garment_count TO dark_garment_count;

-- Add session tracking columns to classes
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS total_students_to_serve_in_class integer NOT NULL DEFAULT 0;

-- Add session/order tracking columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS total_classes_served integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_classes_to_serve integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_students_served_in_school integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_session_active boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_served boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hosted_by text DEFAULT 'SESSION NOT HOSTED',
ADD COLUMN IF NOT EXISTS device_used_mac text DEFAULT 'SESSION NOT HOSTED';

-- Update status column constraint to include new session statuses
-- Drop existing constraint if any
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- The status column already exists as order_status enum, we'll keep using it
-- PENDING, CONFIRMED, QUEUED, IN_PROGRESS, COMPLETED are already part of order_status

-- Add sessions_hosted column to staff table (for operators)
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS sessions_hosted integer NOT NULL DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_session_id ON public.students(session_id);
CREATE INDEX IF NOT EXISTS idx_classes_session_id ON public.classes(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_is_session_active ON public.orders(is_session_active);