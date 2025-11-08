-- Add total_students column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_students integer NOT NULL DEFAULT 0;