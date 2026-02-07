import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DisputeEmailRequest {
  type: "dispute_created" | "dispute_response_needed" | "dispute_resolved";
  recipientEmail: string;
  recipientName?: string;
  entityName: string;
  disputeId: string;
  isChallenger: boolean;
  deadline?: string;
  resolution?: "challenger_wins" | "owner_wins" | "dismissed";
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      recipientEmail, 
      recipientName,
      entityName, 
      disputeId,
      isChallenger,
      deadline,
      resolution,
      adminNotes 
    }: DisputeEmailRequest = await req.json();

    if (!recipientEmail || !entityName || !type) {
      throw new Error("Missing required fields");
    }

    let subject: string;
    let htmlContent: string;
    const name = recipientName || "User";
    const deadlineDate = deadline ? new Date(deadline).toLocaleString() : "48 hours";

    if (type === "dispute_created") {
      if (isChallenger) {
        subject = `⚖️ Your Dispute for "${entityName}" Has Been Filed`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(251, 191, 36, 0.1)); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 16px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">⚖️</span>
              </div>
              <h1 style="color: #fbbf24; text-align: center; margin-bottom: 20px; font-size: 24px;">
                Dispute Filed Successfully
              </h1>
              <p style="color: #e5e7eb; text-align: center; font-size: 16px; line-height: 1.6;">
                Hi ${name}, your dispute for <strong style="color: #ffffff;">"${entityName}"</strong> has been submitted.
              </p>
              <div style="background: rgba(234, 179, 8, 0.2); border-radius: 12px; padding: 20px; margin-top: 30px;">
                <p style="color: #fcd34d; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                  ⏰ What happens next:
                </p>
                <ul style="color: #e5e7eb; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                  <li>The current owner has <strong>48 hours</strong> to respond</li>
                  <li>You can add more evidence in your dashboard</li>
                  <li>An admin will review and decide</li>
                </ul>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://maiapp.lovable.app/dashboard" style="display: inline-block; background: #fbbf24; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Track Your Dispute
                </a>
              </div>
              <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 12px;">
                This is an automated message from MAI Pulse
              </p>
            </div>
          </body>
          </html>
        `;
      } else {
        // Email to current owner
        subject = `⚠️ Alert: Someone is Disputing "${entityName}"`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(234, 179, 8, 0.1)); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">⚠️</span>
              </div>
              <h1 style="color: #f87171; text-align: center; margin-bottom: 20px; font-size: 24px;">
                Your Profile is Being Disputed
              </h1>
              <p style="color: #e5e7eb; text-align: center; font-size: 16px; line-height: 1.6;">
                Hi ${name}, someone has filed a dispute claiming ownership of <strong style="color: #ffffff;">"${entityName}"</strong>.
              </p>
              <div style="background: rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #fca5a5; margin: 0 0 5px 0; font-size: 14px;">
                  ⏰ You must respond within
                </p>
                <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                  48 HOURS
                </p>
                <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 12px;">
                  Deadline: ${deadlineDate}
                </p>
              </div>
              <div style="background: rgba(234, 179, 8, 0.2); border-radius: 12px; padding: 20px; margin-top: 20px;">
                <p style="color: #fcd34d; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                  📋 To defend your ownership:
                </p>
                <ul style="color: #e5e7eb; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                  <li>Submit a response explaining your ownership</li>
                  <li>Upload evidence (ID, documents, links)</li>
                  <li>Failure to respond may result in losing the profile</li>
                </ul>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://maiapp.lovable.app/dashboard" style="display: inline-block; background: #ef4444; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Respond Now
                </a>
              </div>
              <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 12px;">
                This is an automated message from MAI Pulse
              </p>
            </div>
          </body>
          </html>
        `;
      }
    } else if (type === "dispute_resolved") {
      const won = (isChallenger && resolution === "challenger_wins") || 
                  (!isChallenger && resolution === "owner_wins");
      
      subject = won 
        ? `✅ You Won the Dispute for "${entityName}"!`
        : `❌ Dispute Decision for "${entityName}"`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, ${won ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)'}, rgba(59, 130, 246, 0.1)); border: 1px solid ${won ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)'}; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">${won ? '✅' : '❌'}</span>
            </div>
            <h1 style="color: ${won ? '#22c55e' : '#9ca3af'}; text-align: center; margin-bottom: 20px; font-size: 24px;">
              ${won ? 'You Won!' : 'Dispute Resolved'}
            </h1>
            <p style="color: #e5e7eb; text-align: center; font-size: 16px; line-height: 1.6;">
              The dispute for <strong style="color: #ffffff;">"${entityName}"</strong> has been resolved.
            </p>
            <div style="background: ${won ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; border-radius: 12px; padding: 20px; margin-top: 30px;">
              <p style="color: ${won ? '#86efac' : '#d1d5db'}; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                Decision: ${resolution?.replace('_', ' ').toUpperCase()}
              </p>
              ${adminNotes ? `<p style="color: #e5e7eb; margin: 0; font-size: 14px;">"${adminNotes}"</p>` : ''}
            </div>
            ${won && isChallenger ? `
              <div style="background: rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center;">
                <p style="color: #93c5fd; margin: 0; font-size: 14px;">
                  🎉 The profile has been transferred to you!
                </p>
              </div>
            ` : ''}
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://maiapp.lovable.app/dashboard" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Dashboard
              </a>
            </div>
            <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 12px;">
              This is an automated message from MAI Pulse
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error("Invalid email type");
    }

    const emailResponse = await resend.emails.send({
      from: "MAI Pulse <noreply@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    console.log("Dispute email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-dispute-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
