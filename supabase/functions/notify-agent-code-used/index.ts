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
          staff!inner(
            email,
            full_name
          )
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

    const agentEmail = codeData.agents.staff.email;
    const agentName = codeData.agents.staff.full_name;
    const promoCode = codeData.code;

    // For now, we'll log the email that would be sent
    // In production, integrate with an email service like Resend
    console.log('=== Agent Notification Email ===');
    console.log(`To: ${agentEmail}`);
    console.log(`Subject: 🎉 Your Promo Code ${promoCode} Was Used!`);
    console.log(`
      Hi ${agentName},

      Great news! A school has signed up using your promo code.

      School Details:
      - Name: ${schoolName}
      - Email: ${schoolEmail}
      - Location: ${schoolDistrict}, ${schoolRegion}, ${schoolCountry}
      - Promo Code Used: ${promoCode}
      - Date: ${new Date().toLocaleDateString()}

      You will earn a 2% commission on their first order!

      Keep sharing your promo codes to grow your referral network.

      Best regards,
      Project Fusion Team
    `);
    console.log('================================');

    // Return success - email content is logged for now
    // TODO: Integrate with Resend or another email service
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent notification logged successfully',
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
