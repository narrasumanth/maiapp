import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { HeroSearchBar } from "@/components/home/HeroSearchBar";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { MinimalScanLoader } from "@/components/MinimalScanLoader";
import { MatchingEntries } from "@/components/MatchingEntries";
import { ScoreRevealAnimation } from "@/components/ScoreRevealAnimation";
import { analyzeReputation, checkDisambiguation, DisambiguationOption } from "@/lib/api/reputation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationOptions, setDisambiguationOptions] = useState<DisambiguationOption[]>([]);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState<DisambiguationOption | undefined>();
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | undefined>();
  const [pendingResult, setPendingResult] = useState<any>(null);

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

  const trendingEntities = [
    { name: "Tesla", score: 92, change: "+4" },
    { name: "OpenAI", score: 88, change: "+7" },
    { name: "Apple", score: 85, change: "-2" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <ScoreRevealAnimation 
        isVisible={showReveal} 
        searchQuery={searchQuery}
        targetScore={pendingResult?.result?.score}
        onReveal={handleReveal}
      />

      <PulseWaveBackground />

      <main className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {showDisambiguation ? (
            <div className="flex-1 flex items-center justify-center px-4 pt-20">
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
            </div>
          ) : isScanning ? (
            <div className="flex-1 flex items-center justify-center px-4 pt-20">
              <MinimalScanLoader key="scanning" searchQuery={searchQuery} />
            </div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Hero Section */}
              <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 min-h-[70vh]">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary tracking-wide">
                      AI-Powered Trust Analysis
                    </span>
                  </motion.div>

                  {/* Headline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                  >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                      Trust Score for
                      <br />
                      <span className="text-primary">Anyone & Anything</span>
                    </h1>
                    
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                      Get instant AI-powered reputation analysis for businesses, 
                      celebrities, products, and more.
                    </p>
                  </motion.div>

                  {/* Search Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="pt-4"
                  >
                    <HeroSearchBar onSearch={handleSearch} />
                  </motion.div>

                  {/* Quick searches */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">Try:</span>
                    {["Taylor Swift", "Tesla", "OpenAI"].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-3 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </motion.div>
                </div>
              </section>

              {/* Trending Section */}
              <section className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-4 py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-medium text-foreground">Trending Now</h2>
                      </div>
                      <button 
                        onClick={() => navigate("/feed")}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        View all
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {trendingEntities.map((entity, index) => (
                        <motion.button
                          key={entity.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          onClick={() => handleSearch(entity.name)}
                          className="group flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {entity.name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {entity.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Score: {entity.score}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-score-green">
                            {entity.change}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Stats Bar */}
              <section className="border-t border-border/50">
                <div className="max-w-5xl mx-auto px-4 py-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-8 sm:gap-16 text-sm"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>10k+ analyses</span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>100+ sources</span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>Real-time data</span>
                    </div>
                  </motion.div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-medium">MAI Pulse</span>
          <span className="mx-2 opacity-30">•</span>
          Powered by the MAI Protocol
        </p>
      </footer>
    </div>
  );
};

export default Index;
