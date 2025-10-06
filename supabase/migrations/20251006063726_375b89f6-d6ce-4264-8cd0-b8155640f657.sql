-- Add AGENT role to user_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'user_role' AND e.enumlabel = 'AGENT') THEN
    ALTER TYPE user_role ADD VALUE 'AGENT';
  END IF;
END $$;

-- Add agent-specific columns to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS sessions_organised integer NOT NULL DEFAULT 0;

-- Ensure agents table has all required columns
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS country text;

-- Make business_name NOT NULL after adding it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agents' 
    AND column_name = 'business_name'
  ) THEN
    -- Only set NOT NULL if column exists and doesn't already have NOT NULL constraint
    EXECUTE 'ALTER TABLE public.agents ALTER COLUMN business_name SET NOT NULL';
  END IF;
END $$;

-- Update staff table to support AGENT role
ALTER TABLE public.staff
ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Update RLS policies for agents table to include AGENT role
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;
DROP POLICY IF EXISTS "Admins can view all agents" ON public.agents;

CREATE POLICY "Admins can manage agents"
ON public.agents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'ADMIN'
  )
);

CREATE POLICY "Agents can view their own data"
ON public.agents
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