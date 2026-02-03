import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    console.log("Searching for:", query);

    // Step 1: Use Firecrawl to search for information about the query
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${query} reviews ratings reputation`,
        limit: 5,
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
          .slice(0, 8000); // Limit content length
      }
    } else {
      console.log("Firecrawl search failed, using AI knowledge only");
    }

    // Step 2: Use AI to analyze and generate a trust score
    const systemPrompt = `You are MAI Protocol, an AI that analyzes the reputation and trustworthiness of entities.

Based on the provided search results (if any) and your knowledge, generate a comprehensive trust analysis.

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

IMPORTANT: Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "category": "<Person|Movie|Restaurant|Place|Product|Business|Song|Show|Game|Book|Service>",
  "summary": "<2-3 sentence summary of the entity>",
  "vibeCheck": "<casual, colloquial 1-2 sentence verdict with a vibe rating out of 10>",
  "evidence": [
    {"icon": "<star|message|news|trending|shield|award>", "title": "<data point title>", "value": "<actual value>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<data point title>", "value": "<actual value>", "positive": <true|false>},
    {"icon": "<star|message|news|trending|shield|award>", "title": "<data point title>", "value": "<actual value>", "positive": <true|false>}
  ],
  "metadata": {
    "release_year": "<if applicable>",
    "creator": "<director/author/artist if applicable>",
    "genre": "<if applicable>",
    "location": "<if applicable>"
  }
}

Score Guidelines:
- 90-100: Diamond tier - exceptional reputation, widely acclaimed
- 75-89: Green/Trusted - generally positive, minor issues
- 50-74: Yellow/Mixed - proceed with caution, notable concerns
- 0-49: Red/Risk - significant concerns, possible scam

Be direct, colloquial, and helpful. The vibeCheck should sound like a friend giving honest advice.`;

    const userMessage = scrapedContent 
      ? `Analyze the reputation of: "${query}"\n\nSearch Results:\n${scrapedContent}`
      : `Analyze the reputation of: "${query}" using your knowledge. If this is an unknown entity, provide a conservative score and explain what's known.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No content from AI");
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the AI response
    let result;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedContent = aiContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add the query name to the result
    result.name = query;

    console.log("Analysis complete for:", query, "Score:", result.score);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-reputation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
