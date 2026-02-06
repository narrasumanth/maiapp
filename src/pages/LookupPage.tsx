import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { analyzeReputation } from "@/lib/api/reputation";

const LookupPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    const lookupEntity = async () => {
      try {
        // Decode the share code
        const decodedCode = decodeURIComponent(code);
        
        // New format: "name-slug_idprefix" (e.g., "donald-trump_abc12345")
        // Old format: "name-slug" (e.g., "donald-trump")
        const hasIdPrefix = decodedCode.includes('_');
        let nameSlug = decodedCode;
        let idPrefix: string | null = null;
        
        if (hasIdPrefix) {
          const parts = decodedCode.split('_');
          nameSlug = parts.slice(0, -1).join('_'); // Everything except last part
          idPrefix = parts[parts.length - 1]; // Last part is ID prefix
        }
        
        const normalizedSearch = nameSlug.toLowerCase().replace(/-/g, ' ').trim();
        
        console.log("Looking up:", { code, decodedCode, nameSlug, idPrefix, normalizedSearch });

        let entities: any[] | null = null;

        // Strategy 1: If we have an ID prefix, try exact UUID match first (most reliable)
        if (idPrefix && /^[a-f0-9]+$/i.test(idPrefix)) {
          const { data: uuidResults } = await supabase
            .from("entities")
            .select(`
              id,
              name,
              category,
              is_verified,
              claimed_by,
              about,
              contact_email,
              website_url
            `)
            .ilike("id", `${idPrefix}%`)
            .limit(1);
            
          if (uuidResults && uuidResults.length > 0) {
            entities = uuidResults;
            console.log("Found by ID prefix:", entities[0].name);
          }
        }

        // Strategy 2: Try exact entity name match
        if (!entities || entities.length === 0) {
          const { data: nameResults } = await supabase
            .from("entities")
            .select(`
              id,
              name,
              category,
              is_verified,
              claimed_by,
              about,
              contact_email,
              website_url
            `)
            .ilike("name", normalizedSearch)
            .limit(1);
          
          if (nameResults && nameResults.length > 0) {
            entities = nameResults;
            console.log("Found by name match:", entities[0].name);
          }
        }

        // Strategy 3: Try normalized_name match (partial)
        if (!entities || entities.length === 0) {
          const { data: normalizedResults } = await supabase
            .from("entities")
            .select(`
              id,
              name,
              category,
              is_verified,
              claimed_by,
              about,
              contact_email,
              website_url
            `)
            .or(`normalized_name.ilike.%${normalizedSearch}%,normalized_name.ilike.%${decodedCode}%`)
            .limit(1);
            
          if (normalizedResults && normalizedResults.length > 0) {
            entities = normalizedResults;
            console.log("Found by normalized_name:", entities[0].name);
          }
        }

        // Strategy 4: Check cache by entity name
        if (!entities || entities.length === 0) {
          const { data: cachedResult } = await supabase
            .from("entity_score_cache")
            .select("*")
            .or(`entity_name.ilike.%${normalizedSearch}%,normalized_name.ilike.%${normalizedSearch}%`)
            .limit(1)
            .maybeSingle();

          if (cachedResult) {
            console.log("Found in cache:", cachedResult.entity_name);
            const result = {
              name: cachedResult.entity_name,
              score: cachedResult.score,
              category: cachedResult.category,
              summary: cachedResult.summary || "",
              vibeCheck: cachedResult.vibe_check || "Profile loaded from shared link.",
              evidence: cachedResult.evidence || [],
              funFact: (cachedResult.metadata as any)?.funFact,
              hardFact: (cachedResult.metadata as any)?.hardFact,
            };

            sessionStorage.setItem("mai-result", JSON.stringify(result));
            sessionStorage.setItem("mai-entity-id", cachedResult.id);
            navigate(`/result?q=${encodeURIComponent(cachedResult.entity_name)}`);
            return;
          }
        }

        // Strategy 5: If still not found, try a fresh analysis
        if (!entities || entities.length === 0) {
          console.log("No match found, running fresh analysis for:", normalizedSearch);
          setIsAnalyzing(true);
          const analysisResult = await analyzeReputation(normalizedSearch);
          
          if (analysisResult.success && analysisResult.data) {
            // Find or create the entity ID
            const { data: newEntity } = await supabase
              .from("entities")
              .select("id")
              .ilike("name", analysisResult.data.name)
              .maybeSingle();

            sessionStorage.setItem("mai-result", JSON.stringify(analysisResult.data));
            if (newEntity) {
              sessionStorage.setItem("mai-entity-id", newEntity.id);
            }
            navigate(`/result?q=${encodeURIComponent(analysisResult.data.name)}`);
            return;
          }

          setError("Could not find or analyze this profile. The link may be invalid.");
          setIsAnalyzing(false);
          return;
        }

        const entity = entities[0];
        console.log("Using entity:", entity.name, entity.id);

        // Fetch the entity score
        const { data: scoreData } = await supabase
          .from("entity_scores")
          .select("score, summary, vibe_check, evidence")
          .eq("entity_id", entity.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!scoreData) {
          // Try cache as fallback
          const { data: cachedScore } = await supabase
            .from("entity_score_cache")
            .select("*")
            .ilike("entity_name", entity.name)
            .limit(1)
            .maybeSingle();

          if (cachedScore) {
            const result = {
              name: entity.name,
              score: cachedScore.score,
              category: entity.category,
              summary: cachedScore.summary || "",
              vibeCheck: cachedScore.vibe_check || "Profile loaded from shared link.",
              evidence: cachedScore.evidence || [],
              funFact: (cachedScore.metadata as any)?.funFact,
              hardFact: (cachedScore.metadata as any)?.hardFact,
            };

            sessionStorage.setItem("mai-result", JSON.stringify(result));
            sessionStorage.setItem("mai-entity-id", entity.id);
            navigate(`/result?q=${encodeURIComponent(entity.name)}`);
            return;
          }

          // Do a fresh analysis
          setIsAnalyzing(true);
          const analysisResult = await analyzeReputation(entity.name);
          
          if (analysisResult.success && analysisResult.data) {
            sessionStorage.setItem("mai-result", JSON.stringify(analysisResult.data));
            sessionStorage.setItem("mai-entity-id", entity.id);
            navigate(`/result?q=${encodeURIComponent(entity.name)}`);
            return;
          }

          setError("Score data not found. Please try searching again.");
          setIsAnalyzing(false);
          return;
        }

        const result = {
          name: entity.name,
          score: scoreData.score,
          category: entity.category,
          summary: scoreData.summary || "",
          vibeCheck: scoreData.vibe_check || "Profile loaded from shared link.",
          evidence: scoreData.evidence || [],
        };

        sessionStorage.setItem("mai-result", JSON.stringify(result));
        sessionStorage.setItem("mai-entity-id", entity.id);
        
        navigate(`/result?q=${encodeURIComponent(entity.name)}`);
      } catch (err) {
        console.error("Lookup error:", err);
        setError("Failed to load profile. Please try again.");
      }
    };

    lookupEntity();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Search Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          {isAnalyzing ? "Analyzing profile..." : "Loading shared profile..."}
        </p>
      </div>
    </div>
  );
};

export default LookupPage;
