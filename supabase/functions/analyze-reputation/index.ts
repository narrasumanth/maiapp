import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Cache TTL in hours
const CACHE_TTL_HOURS = 24;

// Input validation constants
const MAX_QUERY_LENGTH = 200;
const MIN_QUERY_LENGTH = 1;

// Rate limiting constants - per hour limits
const RATE_LIMIT_WINDOW_MINUTES = 60; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 100; // Free/anonymous users: 100 searches per hour
const RATE_LIMIT_MAX_REQUESTS_AUTH = 300; // Signed-in users: 300 searches per hour

// AI Models - with fallback support
const AI_MODELS = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"]; // Try newest first, fallback to stable
const AI_MODEL_FAST = "google/gemini-2.5-flash-lite"; // Faster model for disambiguation

// Simple hash function for IP
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "analyze-reputation");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

// Sanitize query input
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .replace(/[<>'"\\]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " "); // Normalize whitespace
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query, disambiguate, selectedOption } = body;

    // Validate query
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input length validation
    if (query.length < MIN_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Query is too short" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize the query
    const sanitizedQuery = sanitizeQuery(query);

    // Validate selectedOption if provided
    if (selectedOption) {
      if (typeof selectedOption !== "object") {
        return new Response(
          JSON.stringify({ error: "Invalid selectedOption format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (selectedOption.id && typeof selectedOption.id !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid selectedOption.id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (selectedOption.name && (typeof selectedOption.name !== "string" || selectedOption.name.length > MAX_QUERY_LENGTH)) {
        return new Response(
          JSON.stringify({ error: "Invalid selectedOption.name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ===== RATE LIMITING =====
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = await hashIP(clientIP);
    
    // Check for optional authentication (provides higher rate limits)
    let userId: string | null = null;
    let isAuthenticated = false;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser();
      if (!claimsError && claimsData?.user) {
        userId = claimsData.user.id;
        isAuthenticated = true;
      }
    }

    // Rate limit identifier: user_id for authenticated, IP hash for anonymous
    const rateLimitIdentifier = userId || ipHash;
    const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_REQUESTS_AUTH : RATE_LIMIT_MAX_REQUESTS;

    // Check rate limit using database function
    const { data: withinLimit } = await supabase.rpc("check_rate_limit", {
      _identifier: rateLimitIdentifier,
      _action_type: "analyze_reputation",
      _max_requests: maxRequests,
      _window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (withinLimit === false) {
      const limitMessage = isAuthenticated 
        ? `You've used all 300 searches this hour. Your limit resets in 1 hour.`
        : `You've used all 100 free searches this hour. Sign in to get 300 searches per hour!`;
      
      return new Response(
        JSON.stringify({ 
          error: "SEARCH_LIMIT_REACHED",
          message: limitMessage,
          isAuthenticated,
          limit: maxRequests,
          retry_after: RATE_LIMIT_WINDOW_MINUTES * 60 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== DISAMBIGUATION MODE =====
    // If disambiguate=true, ask AI to identify if query is ambiguous
    if (disambiguate === true) {
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "AI service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const disambiguationPrompt = `You are an entity disambiguation assistant. Today's date is ${currentDate}. Analyze if the query "${sanitizedQuery}" could refer to multiple different entities.

CRITICAL: Use your most current knowledge. For political figures, use their CURRENT positions as of ${currentDate}. For example, if someone is the current sitting president, say "Current President" not "Former President".

Consider these common ambiguity patterns:
1. **Locations**: Chain businesses (Chipotle, Starbucks, McDonald's) have thousands of locations - user might want a specific one
2. **People**: Common names (John Smith, Michael Johnson) or celebrities with same name
3. **Movies/Shows**: Remakes, reboots, same title different years (e.g., "Dune" 1984 vs 2021)
4. **Songs**: Same song title by different artists
5. **Products**: Different versions, generations, or models (iPhone 14 vs iPhone 15)
6. **Companies**: Parent vs subsidiary, or different companies with similar names

If the query is clearly specific (includes location, year, full name with context), it's NOT ambiguous.

Return ONLY valid JSON (no markdown):
{
  "isAmbiguous": <true|false>,
  "reason": "<brief explanation why it might be ambiguous or why it's specific>",
  "options": [
    {
      "id": "<unique-id>",
      "name": "<specific entity name>",
      "category": "<Person|Place|Product|Business|Movie|Song|Show|Game|Book|Restaurant|Service>",
      "description": "<1 sentence with CURRENT factual info as of ${currentDate}>",
      "location": "<if applicable, city/country>",
      "metadata": {
        "year": "<if applicable>",
        "creator": "<if applicable>",
        "distinguisher": "<key differentiating factor with CURRENT info>"
      }
    }
  ],
  "clarifyingQuestion": "<optional question to ask user for more specifics>"
}

Rules:
- If ambiguous, provide 3-5 of the MOST LIKELY options the user might mean
- For chain businesses like "Chipotle", include 3 popular cities and a generic "Chipotle (Brand Overall)" option
- For movies with remakes, include different versions by year
- For common names, include the most famous people with that name
- IMPORTANT: For political figures, celebrities, etc. use their CURRENT role/position as of today (${currentDate})
- If NOT ambiguous, set isAmbiguous=false and options=[]`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL_FAST, // Use faster model for disambiguation
          messages: [
            { role: "system", content: disambiguationPrompt },
            { role: "user", content: sanitizedQuery },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI disambiguation failed:", aiResponse.status);
        // Fall back to non-ambiguous
        return new Response(
          JSON.stringify({ isAmbiguous: false, options: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content;

      try {
        const cleanedContent = aiContent
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const result = JSON.parse(cleanedContent);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (parseError) {
        console.error("Failed to parse disambiguation response:", aiContent);
        return new Response(
          JSON.stringify({ isAmbiguous: false, options: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ===== If user selected a specific option, use that context =====
    const selectedName = selectedOption?.name ? sanitizeQuery(selectedOption.name) : "";
    const selectedDesc = selectedOption?.description ? sanitizeQuery(selectedOption.description.slice(0, 100)) : "";
    const selectedLocation = selectedOption?.location ? sanitizeQuery(selectedOption.location.slice(0, 50)) : "";
    const selectedYear = selectedOption?.metadata?.year ? String(selectedOption.metadata.year).slice(0, 10) : "";
    
    const searchContext = selectedOption 
      ? `${selectedName} ${selectedDesc} ${selectedLocation} ${selectedYear}`
      : sanitizedQuery;

    if (!FIRECRAWL_API_KEY) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Web scraping service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the enriched search context for cache key if user selected an option
    const cacheKey = selectedOption 
      ? `${sanitizedQuery.toLowerCase().trim()}|${selectedOption.id}`
      : sanitizedQuery.toLowerCase().trim();
    const normalizedQuery = cacheKey;

    // ===== COST DEFENSE: Check cache first =====
    console.log("Checking cache for:", normalizedQuery);
    
    const { data: cachedResult } = await supabase
      .from("entity_score_cache")
      .select("*")
      .eq("normalized_name", normalizedQuery)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cachedResult) {
      console.log("Cache HIT for:", sanitizedQuery, "Score:", cachedResult.score);
      
      // Increment hit count (fire and forget)
      supabase
        .from("entity_score_cache")
        .update({ hit_count: cachedResult.hit_count + 1 })
        .eq("id", cachedResult.id)
        .then(() => {});

      // Return cached result
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            name: cachedResult.entity_name,
            category: cachedResult.category,
            score: cachedResult.score,
            summary: cachedResult.summary,
            vibeCheck: cachedResult.vibe_check,
            evidence: cachedResult.evidence || [],
            funFact: cachedResult.fun_fact || undefined,
            hardFact: cachedResult.hard_fact || undefined,
            metadata: cachedResult.metadata || {},
            cached: true,
            cachedAt: cachedResult.cached_at,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cache MISS - fetching fresh data for:", sanitizedQuery);

    // ===== Fresh scrape and analysis =====
    // Step 1: Use Firecrawl to search for information about the query
    // Use enriched search context if available
    const firecrawlQuery = selectedOption 
      ? `${selectedName} ${selectedLocation} ${selectedYear} reviews ratings reputation`
      : `${sanitizedQuery} reviews ratings reputation`;
    
    console.log("Firecrawl search query:", firecrawlQuery);
    
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: firecrawlQuery,
        limit: 3, // Reduced for faster response
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
    });

    let scrapedContent = "";
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log("Firecrawl search results:", searchData.success);
      
      if (searchData.success && searchData.data) {
        scrapedContent = searchData.data
          .map((result: any) => `Source: ${result.url}\nTitle: ${result.title}\n${result.markdown || result.description || ""}`)
          .join("\n\n---\n\n")
          .slice(0, 5000); // Reduced content length for faster AI processing
      }
    } else {
      console.log("Firecrawl search failed, using AI knowledge only");
    }

    // Step 2: Use AI to analyze and generate a trust score
    const systemPrompt = `You are MAI Protocol, an AI that analyzes the reputation and trustworthiness of entities.

Based on the provided search results (if any) and your knowledge, generate a comprehensive trust analysis.

CRITICAL: Use the REAL data from the search results to calculate the score. Each search should produce UNIQUE scores based on actual evidence found.

IMPORTANT: Detect the entity type accurately from these categories:
- Person: celebrities, influencers, public figures, professionals
- Movie: films, documentaries, shows, series
- Restaurant: dining establishments, cafes, bars
- Place: locations, attractions, cities, venues
- Product: physical goods, electronics, consumer products
- Business: companies, startups, corporations, brands
- Song: music tracks, albums, artists
- Show: TV series, podcasts, web series
- Game: video games, board games
- Book: novels, textbooks, publications
- Service: online services, subscriptions, platforms

SCORING METHODOLOGY (CRITICAL - follow strictly):
1. START with a base score based on category defaults (unknown entities start at 50)
2. ADJUST based on evidence found:
   - Each positive review/rating adds 2-5 points
   - Each negative review/complaint subtracts 3-7 points
   - Verified credentials add 5-10 points
   - News coverage: positive +3-8, negative -5-15
   - Social proof (followers, engagement) adds 1-5 points
   - Awards/recognition adds 5-15 points
   - Controversies/scandals subtract 10-25 points
   - Lack of online presence: -10-20 points

3. The final score MUST reflect the UNIQUE evidence found for THIS specific entity
4. Two different people/businesses should NEVER have the same score unless they have identical reputation profiles

Score Guidelines:
- 90-100: Diamond tier - exceptional reputation, widely acclaimed, multiple verified achievements
- 75-89: Green/Trusted - generally positive, minor issues, good track record
- 50-74: Yellow/Mixed - proceed with caution, notable concerns, limited info
- 25-49: Orange/Caution - significant concerns, multiple red flags
- 0-24: Red/Risk - serious issues, possible scam, avoid

IMPORTANT: Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "score": <number 0-100 - MUST be unique based on actual evidence>,
  "category": "<Person|Movie|Restaurant|Place|Product|Business|Song|Show|Game|Book|Service>",
  "summary": "<2-3 sentence summary based on REAL information found>",
  "vibeCheck": "<casual, colloquial 1-2 sentence verdict with a vibe rating out of 10>",
  "evidence": [
    {"icon": "<star|message|news|trending|shield|award>", "title": "<specific data point>", "value": "<actual value from search>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<specific data point>", "value": "<actual value from search>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<specific data point>", "value": "<actual value from search>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<specific data point>", "value": "<actual value from search>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<specific data point>", "value": "<actual value from search>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<specific data point>", "value": "<actual value from search>", "positive": <true|false|}
  ],
  "funFact": "<A humorous, quirky, or surprising fact about this entity based on the gathered info. Make it witty and entertaining! Example: 'Legend has it their WiFi password is still 12345678'>",
  "hardFact": "<A serious but interestingly presented factual insight. Make it sound dramatic or intriguing. Example: 'Has survived 3 economic recessions and still hasn't updated their logo since 1987'>",
  "metadata": {
    "release_year": "<if applicable>",
    "creator": "<director/author/artist if applicable>",
    "genre": "<if applicable>",
    "location": "<if applicable>"
  }
}

CRITICAL: Always provide exactly 6 evidence items covering diverse aspects like ratings, reviews, news coverage, social proof, credentials, and notable achievements or concerns.

Be direct, colloquial, and helpful. The vibeCheck should sound like a friend giving honest advice.
Evidence MUST contain real data points from the search results, not generic placeholders.
The funFact should be genuinely funny - think stand-up comedy material based on what you found.
The hardFact should be dramatic/intriguing but factually grounded - think documentary narrator style.`;

    const userMessage = scrapedContent 
      ? `Analyze the reputation of: "${sanitizedQuery}"\n\nSearch Results:\n${scrapedContent}`
      : `Analyze the reputation of: "${sanitizedQuery}" using your knowledge. If this is an unknown entity, provide a conservative score and explain what's known.`;

    // Helper function to call AI with model fallback
    const callAI = async (): Promise<any> => {
      for (const model of AI_MODELS) {
        console.log(`Trying model: ${model}`);
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
              ],
            }),
          });

          if (!aiResponse.ok) {
            if (aiResponse.status === 429) {
              throw { status: 429, message: "Rate limit exceeded. Please try again later." };
            }
            if (aiResponse.status === 402) {
              throw { status: 402, message: "AI usage limit reached. Please add credits to continue." };
            }
            const errorText = await aiResponse.text();
            console.error(`AI gateway error with ${model}:`, aiResponse.status, errorText);
            // Try next model
            continue;
          }

          const aiData = await aiResponse.json();
          console.log(`AI response from ${model}:`, JSON.stringify(Object.keys(aiData)));
          
          const aiContent = aiData.choices?.[0]?.message?.content;

          if (!aiContent) {
            console.error(`Empty AI content from ${model}:`, JSON.stringify(aiData));
            continue; // Try next model
          }

          // Clean and parse the response
          const cleanedContent = aiContent
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          
          const result = JSON.parse(cleanedContent);
          console.log(`Successfully used model: ${model}`);
          return result;
        } catch (parseError: any) {
          if (parseError.status) throw parseError; // Rethrow HTTP errors (429, 402)
          console.error(`Error with model ${model}:`, parseError);
          // Try next model
        }
      }
      // All models failed
      throw { status: 500, message: "AI analysis failed - all models unavailable" };
    };

    let result;
    try {
      result = await callAI();
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "AI analysis failed" }),
        { status: error.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add the query name to the result
    result.name = sanitizedQuery;

    console.log("Analysis complete for:", sanitizedQuery, "Score:", result.score);

    // ===== COST DEFENSE: Save to cache =====
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

      // Fire-and-forget cache save for speed
      supabase.from("entity_score_cache").upsert({
      entity_name: sanitizedQuery,
      normalized_name: normalizedQuery,
      category: result.category,
      score: result.score,
      summary: result.summary,
      vibe_check: result.vibeCheck,
      evidence: result.evidence,
      fun_fact: result.funFact || null,
      hard_fact: result.hardFact || null,
      metadata: result.metadata || {},
      cached_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
    }, {
      onConflict: "normalized_name",
      }).then(() => console.log("Cached result for:", sanitizedQuery));

    return new Response(
      JSON.stringify({ success: true, data: result, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-reputation:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
