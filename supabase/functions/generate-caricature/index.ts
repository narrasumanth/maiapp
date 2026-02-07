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
    const { entityName, category, score, vibeCheck, funFact } = await req.json();

    if (!entityName) {
      return new Response(
        JSON.stringify({ error: "Entity name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build an elegant, professional prompt based on entity type and reputation
    const isHighTrust = score >= 61;
    const isStrongSignal = score >= 86;
    
    // Refined mood based on new tier system
    const mood = isStrongSignal 
      ? "distinguished, authoritative, accomplished, radiating success and trustworthiness" 
      : isHighTrust 
      ? "professional, confident, reliable, approachable" 
      : score >= 40 
      ? "contemplative, measured, nuanced expression" 
      : "enigmatic, complex, guarded demeanor";

    // Professional category-specific styling
    const categoryStyle: Record<string, string> = {
      Person: "elegant executive portrait, sophisticated headshot style, refined features, professional attire appropriate to their field",
      Business: "sleek corporate logo reimagined as an elegant monogram crest, minimalist luxury brand aesthetic",
      Product: "premium product photography style, elegant still life with subtle glow, luxury presentation",
      Restaurant: "artisanal culinary portrait, elegant chef or gourmet dish presentation, Michelin-star aesthetic",
      Movie: "cinematic movie poster portrait, dramatic lighting, Hollywood glamour style",
      Place: "architectural illustration, elegant landmark rendering, sophisticated travel poster aesthetic",
      Song: "album cover art style, elegant musical motif, vinyl record era sophistication",
      Show: "premium entertainment portrait, streaming service key art quality",
      Game: "high-end game art portrait, AAA quality character rendering",
      Book: "literary portrait, classic book cover illustration style, timeless elegance",
      Service: "premium service brand avatar, refined corporate mascot, luxury concierge aesthetic",
    };

    const styleGuide = categoryStyle[category] || "sophisticated professional portrait, refined corporate aesthetic";

    // Extract profession/role hints from vibeCheck or funFact
    const contextHint = vibeCheck || funFact || "";
    
    const prompt = `Create an elegant, sophisticated portrait illustration for "${entityName}".

STYLE: ${styleGuide}
QUALITY: Ultra high-end, museum-quality digital art, refined brush strokes, subtle gradients
MOOD: ${mood}
COLOR PALETTE: Rich, muted tones with subtle accents, no garish colors, sophisticated color harmony
LIGHTING: Professional studio lighting, soft shadows, dimensional depth
COMPOSITION: Centered, balanced, classic portrait composition

${contextHint ? `CONTEXT: ${contextHint}` : ""}

IMPORTANT REQUIREMENTS:
- Clean, minimalist background with subtle gradient or elegant texture
- Professional, polished finish suitable for a premium platform
- No text, words, or watermarks
- Subtle symbolic elements that reflect their field/industry
- Timeless aesthetic that conveys credibility and distinction
- High contrast, sharp details, museum-quality rendering`;

    console.log("Generating caricature for:", entityName, "Prompt:", prompt.slice(0, 200));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation failed:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate caricature" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Caricature generated successfully for:", entityName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        entityName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-caricature:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred generating the caricature" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
