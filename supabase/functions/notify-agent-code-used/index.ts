import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyAgentRequest {
  codeId: string;
  schoolName: string;
  schoolEmail: string;
  schoolCountry: string;
  schoolRegion: string;
  schoolDistrict: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { codeId, schoolName, schoolEmail, schoolCountry, schoolRegion, schoolDistrict }: NotifyAgentRequest = await req.json();

    // Get the agent info from the code
    const { data: codeData, error: codeError } = await supabase
      .from('agent_invitational_codes')
      .select(`
        *,
        agents!inner(
          id,
          business_name,
          country,
          region,
          user_id
        )
      `)
      .eq('id', codeId)
      .single();

    if (codeError || !codeData) {
      console.error('Error fetching code data:', codeError);
      return new Response(
        JSON.stringify({ error: 'Code not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the agent's staff record for email
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('email, full_name')
      .eq('user_id', codeData.agents.user_id)
      .single();

    if (staffError || !staffData) {
      console.error('Error fetching staff data:', staffError);
      return new Response(
        JSON.stringify({ error: 'Staff not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agentEmail = staffData.email;
    const agentName = staffData.full_name;
    const promoCode = codeData.code;

    // Send email notification via send-agent-email function
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-agent-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          type: 'code_used',
          agentEmail: agentEmail,
          agentName: agentName,
          schoolName: schoolName,
          schoolEmail: schoolEmail,
          schoolCountry: schoolCountry,
          schoolRegion: schoolRegion,
          schoolDistrict: schoolDistrict,
          promoCode: promoCode
        })
      });

      const emailResult = await emailResponse.json();
      console.log('Email notification result:', emailResult);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the function if email fails
    }

    // Log for debugging
    console.log('=== Agent Notification ===');
    console.log(`Agent: ${agentName} (${agentEmail})`);
    console.log(`School: ${schoolName}`);
    console.log(`Promo Code: ${promoCode}`);
    console.log('===========================');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent notification sent successfully',
        agentEmail,
        schoolName 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-agent-code-used function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
