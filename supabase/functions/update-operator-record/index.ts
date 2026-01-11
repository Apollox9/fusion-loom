import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    );

    const body = await req.json();
    const { operator_id, operator_hosted_session_to_completion } = body;

    if (!operator_id) {
      return new Response(
        JSON.stringify({ error: "operator_id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only increment if operator_hosted_session_to_completion === true
    if (operator_hosted_session_to_completion !== true) {
      return new Response(
        JSON.stringify({
          message: "No increment. operator_hosted_session_to_completion must be true.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current operator (from staff table)
    const { data: operator, error: fetchError } = await supabase
      .from("staff")
      .select("id, sessions_hosted")
      .eq("staff_id", operator_id)
      .eq("role", "OPERATOR")
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!operator) {
      return new Response(
        JSON.stringify({ error: "Operator not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment sessions_hosted
    const newCount = (operator.sessions_hosted ?? 0) + 1;
    const { data, error } = await supabase
      .from("staff")
      .update({ sessions_hosted: newCount })
      .eq("id", operator.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        message: "Operator sessions_hosted incremented successfully",
        operator: data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('Error in update-operator-record:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});