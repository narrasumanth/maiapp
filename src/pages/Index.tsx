import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Heart, Zap } from "lucide-react";
import { HeroSearchBar } from "@/components/home/HeroSearchBar";
import { LiveTicker } from "@/components/home/LiveTicker";
import { PulseGrid } from "@/components/home/PulseGrid";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { HeartbeatLogo } from "@/components/home/HeartbeatLogo";

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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Score Reveal Animation */}
      <ScoreRevealAnimation 
        isVisible={showReveal} 
        searchQuery={searchQuery}
        onReveal={handleReveal}
      />

      {/* Pulse Wave Background */}
      <PulseWaveBackground />

      {/* Live Ticker */}
      <LiveTicker />

      {/* Main Content - Full Page */}
      <main className="flex-1 flex flex-col relative z-10 pt-24 pb-8">
        <AnimatePresence mode="wait">
          {showDisambiguation ? (
            <div className="flex-1 flex items-center justify-center px-4">
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
            <div className="flex-1 flex items-center justify-center px-4">
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
              <div className="flex-shrink-0 text-center px-4 pt-8 pb-12 space-y-8">
                {/* Pulse Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(340,80%,50%)]/10 border border-[hsl(340,80%,50%)]/30"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Heart className="w-4 h-4 text-[hsl(340,80%,55%)]" fill="currentColor" />
                  </motion.div>
                  <span className="text-sm font-medium text-[hsl(340,80%,65%)]">
                    Reputation Health Monitor
                  </span>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    <span className="text-foreground">How Strong Is</span>
                    <br />
                    <span className="bg-gradient-to-r from-[hsl(340,80%,60%)] via-[hsl(280,70%,60%)] to-[hsl(200,80%,60%)] bg-clip-text text-transparent">
                      Your Pulse?
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
                    The reputation vital signs for the digital age. Check the pulse on any 
                    <span className="text-[hsl(340,80%,65%)]"> restaurant</span>,
                    <span className="text-[hsl(280,70%,65%)]"> celebrity</span>,
                    <span className="text-[hsl(200,80%,65%)]"> business</span>, or
                    <span className="text-[hsl(160,70%,55%)]"> product</span>.
                  </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center justify-center gap-6 md:gap-10 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[hsl(160,70%,55%)]" />
                    <span className="text-muted-foreground">Real-time monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[hsl(45,100%,55%)]" />
                    <span className="text-muted-foreground">AI-powered analysis</span>
                  </div>
                </motion.div>

                {/* Hero Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <HeroSearchBar onSearch={handleSearch} />
                </motion.div>

                {/* CTA Text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-muted-foreground"
                >
                  Try searching: <span className="text-[hsl(340,80%,65%)] cursor-pointer hover:underline" onClick={() => handleSearch("Taylor Swift")}>Taylor Swift</span> • 
                  <span className="text-[hsl(280,70%,65%)] cursor-pointer hover:underline ml-1" onClick={() => handleSearch("OpenAI")}> OpenAI</span> • 
                  <span className="text-[hsl(200,80%,65%)] cursor-pointer hover:underline ml-1" onClick={() => handleSearch("Noma Restaurant")}> Noma Restaurant</span>
                </motion.p>
              </div>

              {/* Pulse Grid - Full Width */}
              <motion.div
                className="flex-1 px-4 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="max-w-3xl mx-auto">
                  <PulseGrid />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          <span className="bg-gradient-to-r from-[hsl(340,80%,60%)] to-[hsl(280,70%,60%)] bg-clip-text text-transparent font-medium">MAI Pulse</span>
          <span className="mx-2">•</span>
          <span>Powered by the MAI Protocol</span>
        </p>
      </footer>
    </div>
  );
};

export default Index;
