-- Add printing_done_at column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS printing_done_at TEXT;

-- Add scheduling columns to orders table for the admin workflow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_message_copied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_duration_hours NUMERIC;

-- Add submitted_data column to audit_reports to store original data
ALTER TABLE public.audit_reports
ADD COLUMN IF NOT EXISTS submitted_data JSONB;

-- Add submitted garment counts to students table to preserve original submission
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS submitted_light_garment_count INTEGER,
ADD COLUMN IF NOT EXISTS submitted_dark_garment_count INTEGER;

-- Add submitted student count to classes table to preserve original submission
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS submitted_students_count INTEGER;

-- Add submitted totals to orders table to preserve original submission
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS submitted_total_students INTEGER,
ADD COLUMN IF NOT EXISTS submitted_total_garments INTEGER,
ADD COLUMN IF NOT EXISTS submitted_total_light_garments INTEGER,
ADD COLUMN IF NOT EXISTS submitted_total_dark_garments INTEGER,
ADD COLUMN IF NOT EXISTS submitted_total_classes INTEGER;