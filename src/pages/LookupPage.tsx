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
        // Decode the share code - it could be:
        // 1. A URL-encoded entity name (e.g., "Donald%20Trump")
        // 2. A UUID prefix (first 8 chars without hyphens)
        // 3. A normalized name slug (e.g., "donald-trump")
        const decodedCode = decodeURIComponent(code);
        const normalizedSearch = decodedCode.toLowerCase().replace(/-/g, ' ').trim();
        
        console.log("Looking up:", { code, decodedCode, normalizedSearch });

        // Strategy 1: Try exact entity name match
        let { data: entities } = await supabase
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

        // Strategy 2: Try normalized_name match
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
          }
        }

        // Strategy 3: Try UUID prefix match (if code looks like hex)
        if ((!entities || entities.length === 0) && /^[a-f0-9-]+$/i.test(code)) {
          const uuidPrefix = code.replace(/-/g, '').toLowerCase();
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
            .ilike("id", `${uuidPrefix.substring(0, 8)}%`)
            .limit(1);
            
          if (uuidResults && uuidResults.length > 0) {
            entities = uuidResults;
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
