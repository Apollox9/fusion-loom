-- Create function to increment agent's total_schools_referred
CREATE OR REPLACE FUNCTION public.increment_agent_schools_referred(agent_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.agents
  SET total_schools_referred = total_schools_referred + 1
  WHERE id = agent_uuid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_agent_schools_referred(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_agent_schools_referred(UUID) TO anon;