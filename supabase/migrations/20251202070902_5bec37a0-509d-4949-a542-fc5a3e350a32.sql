-- Add current class and current student tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN current_class_name text,
ADD COLUMN current_student_name text;