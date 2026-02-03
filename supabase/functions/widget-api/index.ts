import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Expected path: /widget-api/{token}
    const token = pathParts[pathParts.length - 1];

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Look up widget token
    const { data: widget, error: widgetError } = await supabase
      .from("widget_tokens")
      .select(`
        id,
        entity_id,
        style_config,
        domains,
        is_active,
        impression_count,
        entities (
          id,
          name,
          category
        )
      `)
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (widgetError || !widget) {
      return new Response(
        JSON.stringify({ success: false, error: "Widget not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check domain restriction
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const allowedDomains = widget.domains || [];
    
    if (allowedDomains.length > 0) {
      const originHost = new URL(origin || "http://localhost").hostname;
      const isAllowed = allowedDomains.some((domain: string) => 
        originHost === domain || originHost.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ success: false, error: "Domain not allowed" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get latest score
    const { data: scoreData } = await supabase
      .from("entity_scores")
      .select("score")
      .eq("entity_id", widget.entity_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Increment impression count (fire and forget)
    supabase
      .from("widget_tokens")
      .update({ impression_count: widget.impression_count + 1 })
      .eq("id", widget.id)
      .then(() => {});

    // Handle entities relation (could be array from join)
    const entities = widget.entities as unknown as { id: string; name: string; category: string } | { id: string; name: string; category: string }[] | null;
    const entity = Array.isArray(entities) ? entities[0] : entities;
    const styleConfig = widget.style_config as { theme?: string; size?: string } | null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          score: scoreData?.score || 75,
          name: entity?.name || "Unknown",
          category: entity?.category || "Unknown",
          theme: styleConfig?.theme || "dark",
          size: styleConfig?.size || "medium",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Widget API error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
