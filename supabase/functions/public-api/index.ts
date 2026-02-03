import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const path = url.pathname.replace("/public-api", "");
  const apiKey = req.headers.get("x-api-key");

  // Rate limit check helper
  const checkRateLimit = async (keyId: string, limit: number) => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("api_usage_logs")
      .select("id", { count: "exact" })
      .eq("api_key_id", keyId)
      .gte("created_at", hourAgo);
    
    return (count || 0) < limit;
  };

  // Log API usage
  const logUsage = async (keyId: string | null, endpoint: string, method: string, statusCode: number, responseTime: number) => {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("api_usage_logs").insert({
      api_key_id: keyId,
      endpoint,
      method,
      response_code: statusCode,
      response_time_ms: responseTime,
      ip_address: clientIP,
    });
  };

  const startTime = Date.now();
  let apiKeyId: string | null = null;
  let rateLimit = 10; // Default for unauthenticated

  try {
    // Validate API key if provided
    if (apiKey) {
      const keyPrefix = apiKey.substring(0, 8);
      
      const { data: keyData } = await supabase
        .from("api_keys")
        .select("id, key_hash, permissions, rate_limit_per_hour, is_active, expires_at")
        .eq("key_prefix", keyPrefix)
        .eq("is_active", true)
        .single();

      if (!keyData) {
        const responseTime = Date.now() - startTime;
        await logUsage(null, path, req.method, 401, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        const responseTime = Date.now() - startTime;
        await logUsage(keyData.id, path, req.method, 401, responseTime);
        return new Response(
          JSON.stringify({ error: "API key expired" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      apiKeyId = keyData.id;
      rateLimit = keyData.rate_limit_per_hour;

      // Check rate limit
      const withinLimit = await checkRateLimit(keyData.id, rateLimit);
      if (!withinLimit) {
        const responseTime = Date.now() - startTime;
        await logUsage(keyData.id, path, req.method, 429, responseTime);
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", limit: rateLimit, period: "hour" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last used
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyData.id);
    }

    // Route handling
    if (path === "/health" || path === "") {
      const responseTime = Date.now() - startTime;
      await logUsage(apiKeyId, path, req.method, 200, responseTime);
      return new Response(
        JSON.stringify({ 
          status: "ok", 
          version: "1.0.0",
          endpoints: [
            "GET /score/:name - Get trust score for an entity",
            "GET /entity/:id - Get entity details by ID",
            "GET /search?q=query - Search entities",
            "POST /verify - Verify a private share link",
          ]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /score/:name - Public score lookup
    if (path.startsWith("/score/") && req.method === "GET") {
      const name = decodeURIComponent(path.replace("/score/", ""));
      const normalizedName = name.toLowerCase().trim();

      const { data: entity } = await supabase
        .from("entities")
        .select("id, name, category, privacy_level")
        .eq("normalized_name", normalizedName)
        .single();

      if (!entity) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 404, responseTime);
        return new Response(
          JSON.stringify({ error: "Entity not found", suggestion: "Use /search to find entities" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: score } = await supabase
        .from("entity_scores")
        .select("score, summary, vibe_check, evidence, created_at")
        .eq("entity_id", entity.id)
        .single();

      // Check privacy level
      let response: any = {
        id: entity.id,
        name: entity.name,
        category: entity.category,
        score: score?.score || null,
      };

      // Add more details if not private or has valid API key
      if (entity.privacy_level !== "private" || apiKey) {
        response.summary = score?.summary;
        response.last_updated = score?.created_at;
      }

      if (entity.privacy_level === "public" || apiKey) {
        response.vibe_check = score?.vibe_check;
        response.evidence = score?.evidence;
      }

      const responseTime = Date.now() - startTime;
      await logUsage(apiKeyId, path, req.method, 200, responseTime);

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /entity/:id - Get by ID
    if (path.startsWith("/entity/") && req.method === "GET") {
      const id = path.replace("/entity/", "");

      const { data: entity } = await supabase
        .from("entities")
        .select(`
          id, name, category, is_verified, privacy_level,
          about, website_url, created_at
        `)
        .eq("id", id)
        .single();

      if (!entity) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 404, responseTime);
        return new Response(
          JSON.stringify({ error: "Entity not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: score } = await supabase
        .from("entity_scores")
        .select("*")
        .eq("entity_id", entity.id)
        .single();

      // Respect privacy settings
      const isPublic = entity.privacy_level === "public";
      const hasApiKey = !!apiKey;

      const response: any = {
        id: entity.id,
        name: entity.name,
        category: entity.category,
        is_verified: entity.is_verified,
        score: score?.score,
      };

      if (isPublic || hasApiKey) {
        response.summary = score?.summary;
        response.vibe_check = score?.vibe_check;
        response.about = entity.about;
        response.website_url = entity.website_url;
        response.evidence = score?.evidence;
        response.positive_reactions = score?.positive_reactions;
        response.negative_reactions = score?.negative_reactions;
      }

      const responseTime = Date.now() - startTime;
      await logUsage(apiKeyId, path, req.method, 200, responseTime);

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /search?q=query
    if (path === "/search" && req.method === "GET") {
      const query = url.searchParams.get("q");
      const category = url.searchParams.get("category");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);

      if (!query || query.length < 2) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Query must be at least 2 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let dbQuery = supabase
        .from("entities")
        .select("id, name, category, is_verified")
        .ilike("name", `%${query}%`)
        .limit(limit);

      if (category) {
        dbQuery = dbQuery.eq("category", category);
      }

      const { data: entities } = await dbQuery;

      const responseTime = Date.now() - startTime;
      await logUsage(apiKeyId, path, req.method, 200, responseTime);

      return new Response(
        JSON.stringify({ results: entities || [], count: entities?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /verify - Verify private share link
    if (path === "/verify" && req.method === "POST") {
      const { token } = await req.json();

      if (!token) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: link } = await supabase
        .from("private_share_links")
        .select("*")
        .eq("access_token", token)
        .eq("is_active", true)
        .single();

      if (!link) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 404, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid or expired link" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        await supabase
          .from("private_share_links")
          .update({ is_active: false })
          .eq("id", link.id);

        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 410, responseTime);
        return new Response(
          JSON.stringify({ error: "Link has expired" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check max uses
      if (link.max_uses && link.use_count >= link.max_uses) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 410, responseTime);
        return new Response(
          JSON.stringify({ error: "Link has reached maximum uses" }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Increment use count
      await supabase
        .from("private_share_links")
        .update({ use_count: link.use_count + 1 })
        .eq("id", link.id);

      // Fetch entity data based on access level
      const { data: entity } = await supabase
        .from("entities")
        .select("*")
        .eq("id", link.entity_id)
        .single();

      const { data: score } = await supabase
        .from("entity_scores")
        .select("*")
        .eq("entity_id", link.entity_id)
        .single();

      let response: any = {
        access_level: link.access_level,
        entity: {
          id: entity?.id,
          name: entity?.name,
          category: entity?.category,
          score: score?.score,
        }
      };

      if (link.access_level === "detailed" || link.access_level === "full") {
        response.entity.summary = score?.summary;
        response.entity.vibe_check = score?.vibe_check;
        response.entity.evidence = score?.evidence;
      }

      if (link.access_level === "full") {
        response.entity.about = entity?.about;
        response.entity.is_verified = entity?.is_verified;
        response.entity.website_url = entity?.website_url;
        response.entity.contact_email = entity?.contact_email;
      }

      const responseTime = Date.now() - startTime;
      await logUsage(apiKeyId, path, req.method, 200, responseTime);

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 404 for unknown routes
    const responseTime = Date.now() - startTime;
    await logUsage(apiKeyId, path, req.method, 404, responseTime);
    return new Response(
      JSON.stringify({ error: "Endpoint not found", path }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("API Error:", error);
    const responseTime = Date.now() - startTime;
    await logUsage(apiKeyId, path, req.method, 500, responseTime);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
