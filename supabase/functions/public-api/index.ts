import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Input validation constants
const MAX_QUERY_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 50;
const MAX_TOKEN_LENGTH = 100;

// Rate limiting for unauthenticated requests
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_MAX_UNAUTHENTICATED = 30; // 30 requests per 5 minutes per IP

// Simple hash function for IP
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "public-api");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Sanitize and validate search query to prevent SQL injection
function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .replace(/[%_\\]/g, "\\$&") // Escape SQL LIKE wildcards
    .replace(/[<>'"]/g, ""); // Remove potentially dangerous characters
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const path = url.pathname.replace("/public-api", "");
  const apiKey = req.headers.get("x-api-key");
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

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

  // IP-based rate limit for unauthenticated requests
  const checkIPRateLimit = async () => {
    const ipHash = await hashIP(clientIP);
    const { data: withinLimit } = await supabase.rpc("check_rate_limit", {
      _identifier: ipHash,
      _action_type: "public_api",
      _max_requests: RATE_LIMIT_MAX_UNAUTHENTICATED,
      _window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });
    return withinLimit !== false;
  };

  // Log API usage
  const logUsage = async (keyId: string | null, endpoint: string, method: string, statusCode: number, responseTime: number) => {
    const ipHash = await hashIP(clientIP);
    await supabase.from("api_usage_logs").insert({
      api_key_id: keyId,
      endpoint,
      method,
      response_code: statusCode,
      response_time_ms: responseTime,
      ip_address: ipHash, // Store hashed IP for privacy
    });
  };

  const startTime = Date.now();
  let apiKeyId: string | null = null;
  let rateLimit = 10; // Default for unauthenticated

  try {
    // Validate API key if provided
    if (apiKey) {
      // Validate API key format
      if (typeof apiKey !== "string" || apiKey.length < 8 || apiKey.length > 100) {
        const responseTime = Date.now() - startTime;
        await logUsage(null, path, req.method, 401, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid API key format" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
    } else {
      // Check IP-based rate limit for unauthenticated requests
      const withinLimit = await checkIPRateLimit();
      if (!withinLimit) {
        const responseTime = Date.now() - startTime;
        await logUsage(null, path, req.method, 429, responseTime);
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded", 
            message: "Please provide an API key for higher limits",
            retry_after: RATE_LIMIT_WINDOW_MINUTES * 60 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      const rawName = path.replace("/score/", "");
      
      // Validate input
      if (!rawName || rawName.length > MAX_QUERY_LENGTH) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid entity name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const name = decodeURIComponent(rawName);
      const normalizedName = name.toLowerCase().trim().slice(0, MAX_QUERY_LENGTH);

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

      // Validate UUID format
      if (!isValidUUID(id)) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid entity ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
        .select("score, summary, vibe_check, evidence, positive_reactions, negative_reactions")
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
      const rawQuery = url.searchParams.get("q");
      const rawCategory = url.searchParams.get("category");
      const limitParam = url.searchParams.get("limit");

      // Validate query
      if (!rawQuery || rawQuery.length < 2) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Query must be at least 2 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize inputs
      const query = sanitizeSearchQuery(rawQuery);
      const category = rawCategory ? sanitizeSearchQuery(rawCategory).slice(0, MAX_CATEGORY_LENGTH) : null;
      const limit = Math.min(Math.max(parseInt(limitParam || "10") || 10, 1), 50);

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
      let body;
      try {
        body = await req.json();
      } catch {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { token } = body;

      // Validate token
      if (!token || typeof token !== "string") {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (token.length > MAX_TOKEN_LENGTH) {
        const responseTime = Date.now() - startTime;
        await logUsage(apiKeyId, path, req.method, 400, responseTime);
        return new Response(
          JSON.stringify({ error: "Invalid token format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize token (alphanumeric only)
      const sanitizedToken = token.replace(/[^a-zA-Z0-9-_]/g, "");

      const { data: link } = await supabase
        .from("private_share_links")
        .select("*")
        .eq("access_token", sanitizedToken)
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
        .select("id, name, category, about, is_verified, website_url, contact_email")
        .eq("id", link.entity_id)
        .single();

      const { data: score } = await supabase
        .from("entity_scores")
        .select("score, summary, vibe_check, evidence")
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
      JSON.stringify({ error: "Endpoint not found" }),
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
