import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EventEmailRequest {
  type: "winner" | "organizer";
  email: string;
  eventTitle: string;
  winnerNames?: string[];
  winnerCount?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, eventTitle, winnerNames, winnerCount }: EventEmailRequest = await req.json();

    if (!email || !eventTitle || !type) {
      throw new Error("Missing required fields");
    }

    let subject: string;
    let htmlContent: string;

    if (type === "winner") {
      subject = `🎉 You Won the "${eventTitle}" Draw!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">🎉</span>
            </div>
            <h1 style="color: #a78bfa; text-align: center; margin-bottom: 20px; font-size: 28px;">
              Congratulations!
            </h1>
            <p style="color: #e5e7eb; text-align: center; font-size: 18px; line-height: 1.6;">
              You were selected as a winner in the <strong style="color: #ffffff;">"${eventTitle}"</strong> draw!
            </p>
            <div style="background: rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #c4b5fd; margin: 0; font-size: 14px;">
                The event organizer will be in touch with next steps.
              </p>
            </div>
            <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 12px;">
              This is an automated message from MAI Pulse
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      const winnerList = winnerNames?.join(", ") || "No winners";
      subject = `🏆 Your "${eventTitle}" Draw is Complete!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 48px;">🏆</span>
            </div>
            <h1 style="color: #60a5fa; text-align: center; margin-bottom: 20px; font-size: 28px;">
              Draw Complete!
            </h1>
            <p style="color: #e5e7eb; text-align: center; font-size: 18px; line-height: 1.6;">
              Your <strong style="color: #ffffff;">"${eventTitle}"</strong> draw has finished.
            </p>
            <div style="background: rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin-top: 30px;">
              <p style="color: #93c5fd; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Winner${(winnerCount || 1) > 1 ? 's' : ''} (${winnerCount || 1})
              </p>
              <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
                ${winnerList}
              </p>
            </div>
            <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 12px;">
              This is an automated message from MAI Pulse
            </p>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "MAI Pulse <noreply@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log("Event email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-event-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
