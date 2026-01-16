-- Add is_audited column to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS is_audited BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_audited column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_audited BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_is_audited ON public.classes(is_audited);
CREATE INDEX IF NOT EXISTS idx_students_is_audited ON public.students(is_audited);