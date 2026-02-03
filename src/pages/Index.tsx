import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, TrendingUp, ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MinimalScanLoader } from "@/components/MinimalScanLoader";
import { MatchingEntries } from "@/components/MatchingEntries";
import { ScoreRevealAnimation } from "@/components/ScoreRevealAnimation";
import { analyzeReputation, checkDisambiguation, DisambiguationOption } from "@/lib/api/reputation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrendingEntity {
  id: string;
  name: string;
  category: string;
  latest_score: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingEntities, setTrendingEntities] = useState<TrendingEntity[]>([]);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationOptions, setDisambiguationOptions] = useState<DisambiguationOption[]>([]);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState<DisambiguationOption | undefined>();
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | undefined>();
  const [pendingResult, setPendingResult] = useState<any>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name, category")
      .order("updated_at", { ascending: false })
      .limit(6);

    if (entities && entities.length > 0) {
      const entityIds = entities.map(e => e.id);
      const { data: scores } = await supabase
        .from("entity_scores")
        .select("entity_id, score")
        .in("entity_id", entityIds);

      const scoreMap = new Map<string, number>();
      scores?.forEach(s => {
        if (!scoreMap.has(s.entity_id)) {
          scoreMap.set(s.entity_id, s.score);
        }
      });

      setTrendingEntities(entities.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        latest_score: scoreMap.get(e.id) || 75,
      })));
    }
  };

  const checkForMultipleResults = async (query: string): Promise<{ options: DisambiguationOption[]; clarifyingQuestion?: string }> => {
    const normalizedQuery = query.toLowerCase().trim();
    
    const { data: existingEntities } = await supabase
      .from("entities")
      .select("id, name, category, about, metadata")
      .or(`normalized_name.ilike.%${normalizedQuery}%,name.ilike.%${normalizedQuery}%`)
      .limit(5);

    if (existingEntities && existingEntities.length > 1) {
      return {
        options: existingEntities.map(e => ({
          id: e.id,
          name: e.name,
          category: e.category,
          description: e.about || undefined,
          metadata: e.metadata as any,
        })),
      };
    }

    try {
      const result = await checkDisambiguation(query);
      if (result.isAmbiguous && result.options.length > 0) {
        return { options: result.options, clarifyingQuestion: result.clarifyingQuestion };
      }
    } catch (err) {
      console.error("Disambiguation check failed:", err);
    }

    return { options: [] };
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setSelectedDisambiguation(undefined);
    setClarifyingQuestion(undefined);
    
    const { options, clarifyingQuestion: question } = await checkForMultipleResults(query);
    
    if (options.length > 1) {
      const optionsWithNew: DisambiguationOption[] = [
        ...options,
        { id: "new", name: query, category: "New Search", description: "Search as a new entity" }
      ];
      setDisambiguationOptions(optionsWithNew);
      setClarifyingQuestion(question);
      setShowDisambiguation(true);
    } else {
      setIsScanning(true);
      startAnalysis(query);
    }
  }, []);

  const handleDisambiguationSelect = useCallback(async (option: DisambiguationOption) => {
    setShowDisambiguation(false);
    
    if (option.id === "new") {
      setSelectedDisambiguation(undefined);
      setIsScanning(true);
      startAnalysis(searchQuery);
    } else if (option.id.startsWith("ai-")) {
      setSelectedDisambiguation(option);
      setSearchQuery(option.name);
      setIsScanning(true);
      startAnalysis(option.name, option);
    } else {
      // Existing entity - load directly
      const { data: scores } = await supabase
        .from("entity_scores")
        .select("*")
        .eq("entity_id", option.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (scores) {
        const result = {
          name: option.name,
          category: option.category,
          score: scores.score,
          summary: scores.summary || "",
          vibeCheck: scores.vibe_check || "",
          evidence: Array.isArray(scores.evidence) ? scores.evidence : [],
        };
        setPendingResult({ result, entityId: option.id, displayName: option.name });
        setShowReveal(true);
      } else {
        setSelectedDisambiguation(option);
        setSearchQuery(option.name);
        setIsScanning(true);
        startAnalysis(option.name, option);
      }
    }
  }, [searchQuery]);

  const startAnalysis = async (query: string, disambiguation?: DisambiguationOption) => {
    try {
      const response = await analyzeReputation(query, disambiguation);
      
      if (response.success && response.data) {
        const normalizedName = disambiguation 
          ? `${query.toLowerCase().trim()}|${disambiguation.id}`
          : query.toLowerCase().trim();
        
        let { data: existingEntity } = await supabase
          .from("entities")
          .select("id")
          .eq("normalized_name", normalizedName)
          .single();

        let entityId: string;

        if (existingEntity) {
          entityId = existingEntity.id;
        } else {
          const { data: newEntity, error } = await supabase
            .from("entities")
            .insert({
              name: disambiguation?.name || response.data.name,
              category: response.data.category,
              normalized_name: normalizedName,
              about: disambiguation?.description,
              metadata: disambiguation?.metadata || response.data.metadata || {},
            })
            .select("id")
            .single();

          entityId = error ? crypto.randomUUID() : newEntity.id;
        }

        await supabase.from("entity_scores").insert({
          entity_id: entityId,
          score: response.data.score,
          vibe_check: response.data.vibeCheck,
          summary: response.data.summary,
          evidence: response.data.evidence,
        });

        const displayName = disambiguation?.name || query;
        await supabase.from("search_history").insert({ query: displayName, entity_id: entityId });

        setIsScanning(false);
        setPendingResult({ result: response.data, entityId, displayName });
        setShowReveal(true);
      } else {
        toast({
          title: "Analysis Failed",
          description: response.error || "Could not analyze this entity.",
          variant: "destructive",
        });
        setIsScanning(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const handleReveal = useCallback(() => {
    if (pendingResult) {
      sessionStorage.setItem("mai-result", JSON.stringify(pendingResult.result));
      sessionStorage.setItem("mai-entity-id", pendingResult.entityId);
      setShowReveal(false);
      setSelectedDisambiguation(undefined);
      navigate(`/result?q=${encodeURIComponent(pendingResult.displayName)}`);
    }
  }, [pendingResult, navigate]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const displayTrending = trendingEntities.length > 0 ? trendingEntities : [
    { id: "1", name: "Tesla", category: "Company", latest_score: 78 },
    { id: "2", name: "ChatGPT", category: "Product", latest_score: 92 },
    { id: "3", name: "Airbnb", category: "Service", latest_score: 71 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Score Reveal Animation */}
      <ScoreRevealAnimation 
        isVisible={showReveal} 
        searchQuery={searchQuery}
        onReveal={handleReveal}
      />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-background opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
      </div>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 pt-16 pb-8">
        <div className="w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {showDisambiguation ? (
              <MatchingEntries
                key="disambiguation"
                query={searchQuery}
                options={disambiguationOptions}
                onSelect={handleDisambiguationSelect}
                onBack={() => {
                  setShowDisambiguation(false);
                  setDisambiguationOptions([]);
                }}
                clarifyingQuestion={clarifyingQuestion}
              />
            ) : isScanning ? (
              <MinimalScanLoader key="scanning" searchQuery={searchQuery} />
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                {/* Hero */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI-Powered Trust Scores</span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    <span className="text-foreground">Know Before</span>{" "}
                    <span className="neon-text">You Trust</span>
                  </h1>
                  
                  <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                    Instantly verify anyone or anything. Search a name, brand, or URL.
                  </p>
                </motion.div>

                {/* Search */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-12"
                >
                  <SearchBar onSearch={handleSearch} />
                </motion.div>

                {/* Trending - Minimal */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Trending</span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {displayTrending.slice(0, 5).map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleSearch(entity.name)}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full glass-card border-white/10 hover:border-primary/30 transition-all"
                      >
                        <span className="text-sm">{entity.name}</span>
                        <span className={`text-xs font-bold ${getScoreColor(entity.latest_score)}`}>
                          {entity.latest_score}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>MAI Protocol • Trust Intelligence</p>
      </footer>
    </div>
  );
};

export default Index;
