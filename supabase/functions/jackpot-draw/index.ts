import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate current hour slot
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const hourSlot = now.toISOString();

    // Get all participants for this hour
    const { data: participants, error: fetchError } = await supabase
      .from("hourly_pool")
      .select("*")
      .eq("hour_slot", hourSlot);

    if (fetchError) {
      console.error("Error fetching participants:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch participants" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!participants || participants.length === 0) {
      console.log("No participants for this hour");
      return new Response(
        JSON.stringify({ success: true, message: "No participants to draw from" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use cryptographically secure random selection
    function getSecureRandomIndex(max: number): number {
      const randomArray = new Uint32Array(1);
      const range = Math.floor(0xFFFFFFFF / max) * max;
      
      // Rejection sampling for uniform distribution
      do {
        crypto.getRandomValues(randomArray);
      } while (randomArray[0] >= range);
      
      return randomArray[0] % max;
    }

    const randomIndex = getSecureRandomIndex(participants.length);
    const winner = participants[randomIndex];

    const prizeAmount = 5000;

    // Create draw record
    const { data: draw, error: drawError } = await supabase
      .from("hourly_draws")
      .insert({
        winner_id: winner.user_id,
        prize_amount: prizeAmount,
        participant_count: participants.length,
        draw_time: now.toISOString(),
      })
      .select()
      .single();

    if (drawError) {
      console.error("Error creating draw:", drawError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create draw record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Award points to winner
    const { error: pointsError } = await supabase.rpc("award_points", {
      _user_id: winner.user_id,
      _action_type: "jackpot_win",
      _amount: prizeAmount,
      _reference_id: draw.id,
    });

    if (pointsError) {
      console.error("Error awarding points:", pointsError);
    }

    // Create winner badge (24 hours)
    await supabase
      .from("winner_badges")
      .insert({
        user_id: winner.user_id,
        badge_type: "jackpot_winner",
        draw_id: draw.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    // Create notification for winner
    await supabase
      .from("notifications")
      .insert({
        user_id: winner.user_id,
        type: "jackpot_win",
        title: "🎉 YOU WON THE JACKPOT!",
        message: `Congratulations! You won ${prizeAmount.toLocaleString()} MAI Points in the hourly jackpot!`,
      });

    // Clean up old pool entries (optional - keep for history or delete)
    await supabase
      .from("hourly_pool")
      .delete()
      .eq("hour_slot", hourSlot);

    console.log(`Draw completed. Winner: ${winner.user_id}, Prize: ${prizeAmount}`);

    return new Response(
      JSON.stringify({
        success: true,
        draw: {
          id: draw.id,
          winner_id: winner.user_id,
          prize_amount: prizeAmount,
          participant_count: participants.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Jackpot draw error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

