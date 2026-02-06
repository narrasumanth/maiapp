import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Build a creative prompt for the caricature
    const scoreEmoji = score >= 90 ? "💎" : score >= 75 ? "✅" : score >= 50 ? "⚠️" : "🚨";
    const mood = score >= 75 ? "confident, successful, trustworthy" : 
                 score >= 50 ? "neutral, contemplative, mixed emotions" : 
                 "suspicious, cautious, uncertain";

    const categoryStyle = {
      Person: "portrait caricature of a person",
      Business: "anthropomorphized building or mascot character representing a company",
      Product: "cartoon product with a face and personality",
      Restaurant: "anthropomorphized restaurant or chef character",
      Movie: "movie poster style with exaggerated characters",
      Place: "whimsical landmark or location with character",
      Song: "musical notes and instruments with personality",
      Show: "TV character caricature",
      Game: "video game character style illustration",
      Book: "book with a face or author caricature",
      Service: "helpful robot or service character mascot",
    }[category] || "cartoon mascot character";

    const prompt = `Create a fun, colorful, exaggerated cartoon caricature for "${entityName}". 
Style: ${categoryStyle}.
Mood: ${mood} (trust score: ${score}/100 ${scoreEmoji}).
Personality hint: ${vibeCheck || funFact || "digital reputation profile"}.
Art style: Bold colors, playful exaggeration, professional digital illustration, suitable for a profile avatar.
Background: Simple gradient or abstract pattern.
DO NOT include any text or words in the image.`;

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
