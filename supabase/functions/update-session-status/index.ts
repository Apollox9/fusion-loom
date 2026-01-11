import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed session statuses (matches order_status enum)
const ALLOWED_STATUSES = [
  "UNSUBMITTED",
  "SUBMITTED",
  "QUEUED",
  "PICKUP",
  "ONGOING",
  "ABORTED",
  "DONE",
  "PACKAGING",
  "DELIVERY",
  "COMPLETED",
  "CONFIRMED",
  "AUTO_CONFIRMED",
];

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
    const { id, ...rest } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update object dynamically
    const updateFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue; // skip undefined values

      // Validate status
      if (key === "status") {
        if (ALLOWED_STATUSES.includes(value as string)) {
          updateFields[key] = value;
        } else {
          return new Response(
            JSON.stringify({
              error: `Invalid status. Allowed values are: ${ALLOWED_STATUSES.join(", ")}`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        updateFields[key] = value;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return new Response(
        JSON.stringify({ error: "No update fields provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform update
    const { data, error } = await supabase
      .from("orders")
      .update(updateFields)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Session updated successfully",
        session: data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('Error in update-session-status:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});