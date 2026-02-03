import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find scores that haven't been reviewed in 30 days and haven't had decay applied recently
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: staleScores, error: fetchError } = await supabase
      .from("entity_scores")
      .select("id, entity_id, score, last_review_at")
      .lt("last_review_at", thirtyDaysAgo.toISOString())
      .eq("decay_applied", false)
      .gt("score", 10); // Don't decay scores below 10

    if (fetchError) {
      console.error("Error fetching stale scores:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch scores" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!staleScores || staleScores.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scores to decay", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${staleScores.length} scores to decay`);

    let processedCount = 0;

    for (const score of staleScores) {
      // Calculate decay: 5% reduction for inactivity
      const decayAmount = Math.max(Math.floor(score.score * 0.05), 1);
      const newScore = Math.max(score.score - decayAmount, 10);

      // Update the score
      const { error: updateError } = await supabase
        .from("entity_scores")
        .update({
          score: newScore,
          decay_applied: true,
        })
        .eq("id", score.id);

      if (updateError) {
        console.error(`Error updating score ${score.id}:`, updateError);
        continue;
      }

      // Get entity owner to send notification
      const { data: entity } = await supabase
        .from("entities")
        .select("name, claimed_by")
        .eq("id", score.entity_id)
        .single();

      if (entity?.claimed_by) {
        // Send notification to entity owner
        await supabase.from("notifications").insert({
          user_id: entity.claimed_by,
          type: "score_change",
          title: "Trust Score Decreased",
          message: `${entity.name}'s score dropped from ${score.score} to ${newScore} due to inactivity. Encourage recent reviews to boost your score!`,
          entity_id: score.entity_id,
        });
      }

      processedCount++;
    }

    console.log(`Processed ${processedCount} score decays`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} score decays`,
        processed: processedCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in score-decay:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
