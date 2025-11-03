import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { operator_id, service_passcode } = body;

    if (!operator_id || !service_passcode) {
      return new Response(
        JSON.stringify({ error: "operator_id and service_passcode required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch operator (from staff table where role is OPERATOR)
    const { data: operator, error: opError } = await supabase
      .from("staff")
      .select("*")
      .eq("staff_id", operator_id)
      .eq("role", "OPERATOR")
      .maybeSingle();

    if (opError) throw opError;
    if (!operator) {
      return new Response(
        JSON.stringify({ error: "Operator not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch session (from orders table)
    const { data: session, error: sessError } = await supabase
      .from("orders")
      .select("*")
      .eq("external_ref", service_passcode)
      .maybeSingle();

    if (sessError) throw sessError;
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all classes belonging to this session
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("*")
      .eq("session_id", session.id)
      .order("name", { ascending: true });

    if (classesError) throw classesError;

    // Fetch school
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("*")
      .eq("id", session.created_by_school)
      .maybeSingle();

    if (schoolError) throw schoolError;

    return new Response(
      JSON.stringify({
        message: "Operator and session found!",
        operator,
        session,
        school: school ?? null,
        classes: classes ?? [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in init-session:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
