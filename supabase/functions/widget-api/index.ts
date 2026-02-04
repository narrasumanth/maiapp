import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_TOKEN_LENGTH = 100;

// Rate limiting constants
const RATE_LIMIT_WINDOW_MINUTES = 1;
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP

// Simple hash function for IP
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "widget-api");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Expected path: /widget-api/{token}
    const token = pathParts[pathParts.length - 1];

    // Validate token
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize token (alphanumeric, hyphens, underscores only)
    const sanitizedToken = token.replace(/[^a-zA-Z0-9-_]/g, "");
    if (sanitizedToken !== token) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ===== RATE LIMITING =====
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = await hashIP(clientIP);

    const { data: withinLimit } = await supabase.rpc("check_rate_limit", {
      _identifier: ipHash,
      _action_type: "widget_api",
      _max_requests: RATE_LIMIT_MAX_REQUESTS,
      _window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (withinLimit === false) {
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      .eq("token", sanitizedToken)
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
    
    if (allowedDomains.length > 0 && origin) {
      try {
        const originHost = new URL(origin).hostname;
        const isAllowed = allowedDomains.some((domain: string) => {
          // Sanitize domain for comparison
          const cleanDomain = domain.toLowerCase().replace(/[^a-z0-9.-]/g, "");
          return originHost === cleanDomain || originHost.endsWith(`.${cleanDomain}`);
        });
        
        if (!isAllowed) {
          return new Response(
            JSON.stringify({ success: false, error: "Domain not allowed" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Invalid origin URL, proceed with caution but don't block
        console.warn("Invalid origin URL:", origin);
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
