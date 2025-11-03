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
    const {
      id,
      printed_dark_garment_count,
      printed_light_garment_count,
      dark_garments_printed,
      light_garments_printed,
      is_served,
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build dynamic update object only with provided fields
    const updateData: any = {};
    if (printed_dark_garment_count !== undefined)
      updateData.printed_dark_garment_count = printed_dark_garment_count;
    if (printed_light_garment_count !== undefined)
      updateData.printed_light_garment_count = printed_light_garment_count;
    if (dark_garments_printed !== undefined)
      updateData.dark_garments_printed = dark_garments_printed;
    if (light_garments_printed !== undefined)
      updateData.light_garments_printed = light_garments_printed;
    if (is_served !== undefined) updateData.is_served = is_served;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No update fields provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the student
    const { data, error } = await supabase
      .from("students")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Student updated successfully",
        student: data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in update-student-status:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
