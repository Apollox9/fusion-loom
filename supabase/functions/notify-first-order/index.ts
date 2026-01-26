import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyFirstOrderRequest {
  orderId: string;
  schoolId: string;
  schoolName: string;
  orderAmount: number;
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

    const { orderId, schoolId, schoolName, orderAmount }: NotifyFirstOrderRequest = await req.json();
    console.log("Processing first order notification for:", schoolName);

    // Check if this is actually the first order for this school
    const { data: existingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('created_by_school', schoolId)
      .order('created_at', { ascending: true })
      .limit(2);

    if (ordersError) {
      console.error('Error checking existing orders:', ordersError);
      throw ordersError;
    }

    // If there's more than one order, this isn't the first one
    if (existingOrders && existingOrders.length > 1 && existingOrders[0].id !== orderId) {
      console.log('Not the first order, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Not first order, skipped' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the school's referral info
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('referred_by_agent_id, referral_code_used')
      .eq('id', schoolId)
      .single();

    if (schoolError || !schoolData?.referred_by_agent_id) {
      console.log('School was not referred by an agent');
      return new Response(
        JSON.stringify({ success: true, message: 'No agent referral found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the credit_worth_factor from the code (this is the frozen value at time of use)
    const { data: codeData, error: codeError } = await supabase
      .from('agent_invitational_codes')
      .select('credit_worth_factor, code')
      .eq('code', schoolData.referral_code_used)
      .single();

    if (codeError) {
      console.error('Error fetching code data:', codeError);
    }

    const creditWorthFactor = codeData?.credit_worth_factor || 1.0;
    const commission = orderAmount * 0.02 * creditWorthFactor;

    // Get agent info
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        business_name,
        user_id
      `)
      .eq('id', schoolData.referred_by_agent_id)
      .single();

    if (agentError || !agentData) {
      console.error('Error fetching agent:', agentError);
      throw new Error('Agent not found');
    }

    // Get agent's staff record for email
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('email, full_name')
      .eq('user_id', agentData.user_id)
      .single();

    if (staffError || !staffData) {
      console.error('Error fetching staff:', staffError);
      throw new Error('Staff record not found');
    }

    // Send email notification via send-agent-email function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-agent-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        type: 'first_order',
        agentEmail: staffData.email,
        agentName: staffData.full_name,
        schoolName: schoolName,
        orderAmount: orderAmount,
        commission: commission,
        creditWorthFactor: creditWorthFactor
      })
    });

    const emailResult = await emailResponse.json();
    console.log('Email notification result:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'First order notification sent',
        commission,
        creditWorthFactor
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-first-order function:", error);
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
