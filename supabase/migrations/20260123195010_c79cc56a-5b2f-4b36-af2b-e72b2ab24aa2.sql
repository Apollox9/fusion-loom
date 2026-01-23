-- Add status column to schools table for tracking confirmation state
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unconfirmed';

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_schools_email ON public.schools(email);

-- Add confirmation_expires_at column
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS confirmation_expires_at TIMESTAMP WITH TIME ZONE;