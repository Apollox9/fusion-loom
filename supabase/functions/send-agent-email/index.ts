import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'code_used' | 'first_order';
  agentEmail: string;
  agentName: string;
  schoolName: string;
  schoolEmail?: string;
  schoolCountry?: string;
  schoolRegion?: string;
  schoolDistrict?: string;
  promoCode?: string;
  orderAmount?: number;
  commission?: number;
  creditWorthFactor?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: EmailRequest = await req.json();
    console.log("Received email request:", emailData);

    let subject: string;
    let htmlContent: string;

    if (emailData.type === 'code_used') {
      subject = `🎉 Your Promo Code ${emailData.promoCode} Was Used!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .highlight { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 New School Referral!</h1>
          </div>
          <div class="content">
            <p>Hi ${emailData.agentName},</p>
            <p>Great news! A school has signed up using your promo code.</p>
            
            <div class="highlight">
              <h3>School Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${emailData.schoolName}</li>
                <li><strong>Email:</strong> ${emailData.schoolEmail}</li>
                <li><strong>Location:</strong> ${emailData.schoolDistrict}, ${emailData.schoolRegion}, ${emailData.schoolCountry}</li>
                <li><strong>Promo Code Used:</strong> ${emailData.promoCode}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>You will earn a commission on their first order! Keep sharing your promo codes to grow your referral network.</p>
          </div>
          <div class="footer">
            <p>Project Fusion Team</p>
          </div>
        </body>
        </html>
      `;
    } else if (emailData.type === 'first_order') {
      subject = `💰 Commission Earned! ${emailData.schoolName} Placed Their First Order`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .commission-box { background: #d1fae5; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .commission-amount { font-size: 36px; font-weight: bold; color: #059669; }
            .details { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 Commission Earned!</h1>
          </div>
          <div class="content">
            <p>Hi ${emailData.agentName},</p>
            <p>Congratulations! A school you referred has placed their first order!</p>
            
            <div class="commission-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Commission</p>
              <p class="commission-amount">TZS ${emailData.commission?.toLocaleString()}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">2% × ${emailData.creditWorthFactor?.toFixed(2)}x credit factor</p>
            </div>
            
            <div class="details">
              <h3>Order Details:</h3>
              <ul>
                <li><strong>School:</strong> ${emailData.schoolName}</li>
                <li><strong>Order Value:</strong> TZS ${emailData.orderAmount?.toLocaleString()}</li>
                <li><strong>Credit Factor:</strong> ${emailData.creditWorthFactor?.toFixed(2)}x</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Keep referring schools to earn more commissions!</p>
          </div>
          <div class="footer">
            <p>Project Fusion Team</p>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error('Invalid email type');
    }

    // Note: In production, replace with your verified Resend domain
    const emailResponse = await resend.emails.send({
      from: "Project Fusion <notifications@resend.dev>",
      to: [emailData.agentEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
