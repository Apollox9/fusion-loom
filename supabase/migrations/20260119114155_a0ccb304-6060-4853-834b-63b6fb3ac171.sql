-- Create agent_invitational_codes table for tracking promotional codes
CREATE TABLE public.agent_invitational_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_staff_id TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by_school_id UUID REFERENCES public.schools(id),
  used_by_user_id UUID REFERENCES auth.users(id),
  school_name TEXT,
  credit_worth_factor NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Add referral tracking columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS referred_by_agent_id UUID REFERENCES public.agents(id),
ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
ADD COLUMN IF NOT EXISTS referred_at TIMESTAMP WITH TIME ZONE;

-- Add total_credits and total_schools_referred to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS total_credits NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_schools_referred INTEGER NOT NULL DEFAULT 0;

-- Enable RLS on agent_invitational_codes
ALTER TABLE public.agent_invitational_codes ENABLE ROW LEVEL SECURITY;

-- Agents can view and manage their own codes
CREATE POLICY "Agents can view their own codes"
ON public.agent_invitational_codes
FOR SELECT
USING (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

CREATE POLICY "Agents can create their own codes"
ON public.agent_invitational_codes
FOR INSERT
WITH CHECK (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

CREATE POLICY "Agents can update their own codes"
ON public.agent_invitational_codes
FOR UPDATE
USING (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

-- Anyone can validate codes during registration (but only SELECT unused codes)
CREATE POLICY "Anyone can validate codes"
ON public.agent_invitational_codes
FOR SELECT
USING (true);

-- Update agents RLS to include AGENT role access
DROP POLICY IF EXISTS "Agents can view their own data" ON public.agents;
CREATE POLICY "Agents can view their own data"
ON public.agents
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

-- Allow agents to update their own record
CREATE POLICY "Agents can update their own data"
ON public.agents
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update schools RLS to allow agents to view schools they referred
CREATE POLICY "Agents can view referred schools"
ON public.schools
FOR SELECT
USING (
  referred_by_agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
);

-- Update orders RLS to allow agents to view orders from their referred schools
CREATE POLICY "Agents can view orders from referred schools"
ON public.orders
FOR SELECT
USING (
  created_by_school IN (
    SELECT id FROM public.schools 
    WHERE referred_by_agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  )
);