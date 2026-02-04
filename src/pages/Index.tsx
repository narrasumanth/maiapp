import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Users, MessageSquare } from "lucide-react";
import { ContactModal } from "@/components/contact/ContactModal";
import { HeroSearchBar } from "@/components/home/HeroSearchBar";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { ProgressiveScanLoader } from "@/components/ProgressiveScanLoader";
import { MatchingEntries } from "@/components/MatchingEntries";
import { ScoreRevealAnimation } from "@/components/ScoreRevealAnimation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { BetaBanner } from "@/components/BetaBanner";
import { analyzeReputation, checkDisambiguation, DisambiguationOption } from "@/lib/api/reputation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ONBOARDING_KEY = "mai-onboarding-complete";

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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding should be shown
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
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
    
    // Show scanning immediately for instant feedback
    setIsScanning(true);
    
    // Run disambiguation check in parallel with showing loader
    const { options, clarifyingQuestion: question } = await checkForMultipleResults(query);
    
    if (options.length > 1) {
      // Multiple matches found - show disambiguation
      setIsScanning(false);
      const optionsWithNew: DisambiguationOption[] = [
        ...options,
        { id: "new", name: query, category: "New Search", description: "Search as a new entity" }
      ];
      setDisambiguationOptions(optionsWithNew);
      setClarifyingQuestion(question);
      setShowDisambiguation(true);
    } else {
      // No disambiguation needed - continue with analysis (already scanning)
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
      {/* Onboarding Flow */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </AnimatePresence>

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
              <ProgressiveScanLoader key="scanning" searchQuery={searchQuery} />
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
                      Know Your{" "}
                      <span className="neon-text">Real Online Pulse</span>
                    </h1>
                    
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                      Instantly analyze anyone's digital reputation. Get clear insights 
                      on who's trustworthy and who's not.
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
                    {["Donald Trump", "OpenAI", "Chipotle"].map((term) => (
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
                                Pulse: {entity.score}
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

              {/* Humor Disclaimer */}
              <section className="border-t border-border/50 bg-secondary/20">
                <div className="max-w-3xl mx-auto px-4 py-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center space-y-2"
                  >
                    <p className="text-sm text-muted-foreground">
                      <span className="text-lg mr-2">⚡</span>
                      <span className="font-medium text-foreground">Powered by real online signals and a dash of humor.</span>{" "}
                      Our AI turns data into insights with personality—mostly fun, occasionally a wake-up call when the pulse drops.
                    </p>
                  </motion.div>
                </div>
              </section>

              {/* Score Examples */}
              <section className="border-t border-border/50">
                <div className="max-w-5xl mx-auto px-4 py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <motion.h2 
                        className="text-xl font-bold text-foreground mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        What the Scores Mean
                      </motion.h2>
                      <motion.p 
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        Real examples of how our AI rates online reputation
                      </motion.p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { score: 95, label: "Diamond", emoji: "💎", example: "Warren Buffett", color: "text-score-diamond", bg: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", glow: "shadow-cyan-500/20", desc: "Stellar reputation, widely trusted" },
                        { score: 78, label: "Trusted", emoji: "✅", example: "Your Local Bank", color: "text-score-green", bg: "from-green-500/20 to-emerald-500/10", border: "border-green-500/30", glow: "shadow-green-500/20", desc: "Solid track record, minor hiccups" },
                        { score: 52, label: "Mixed", emoji: "⚠️", example: "That Viral Startup", color: "text-score-yellow", bg: "from-yellow-500/20 to-orange-500/10", border: "border-yellow-500/30", glow: "shadow-yellow-500/20", desc: "Some red flags, proceed carefully" },
                        { score: 23, label: "Risky", emoji: "🚨", example: "Crypto Bro LLC", color: "text-score-red", bg: "from-red-500/20 to-rose-500/10", border: "border-red-500/30", glow: "shadow-red-500/20", desc: "Major concerns, buyer beware" },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.9 + index * 0.15, type: "spring", stiffness: 200 }}
                          whileHover={{ 
                            scale: 1.05, 
                            y: -5,
                            transition: { duration: 0.2 }
                          }}
                          className={`relative p-5 rounded-2xl bg-gradient-to-b ${item.bg} border ${item.border} text-center space-y-3 cursor-pointer group overflow-hidden shadow-lg ${item.glow} hover:shadow-xl transition-shadow duration-300`}
                        >
                          {/* Animated background pulse */}
                          <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${item.color.includes('diamond') ? 'rgba(34,211,238,0.1)' : item.color.includes('green') ? 'rgba(34,197,94,0.1)' : item.color.includes('yellow') ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)'}, transparent 70%)`
                            }}
                          />
                          
                          {/* Emoji with bounce animation */}
                          <motion.div 
                            className="text-3xl"
                            animate={{ 
                              y: [0, -3, 0],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: index * 0.5,
                              ease: "easeInOut"
                            }}
                          >
                            {item.emoji}
                          </motion.div>
                          
                          {/* Animated score counter */}
                          <motion.div 
                            className={`text-4xl font-bold ${item.color} relative`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.1 + index * 0.15, type: "spring", stiffness: 300 }}
                          >
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.2 + index * 0.15 }}
                            >
                              {item.score}
                            </motion.span>
                            
                            {/* Pulse ring effect */}
                            <motion.div
                              className={`absolute inset-0 rounded-full ${item.border} opacity-50`}
                              animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1 + index * 0.3
                              }}
                            />
                          </motion.div>
                          
                          {/* Label with underline animation */}
                          <div className="relative">
                            <span className="font-semibold text-foreground text-lg">{item.label}</span>
                            <motion.div 
                              className={`h-0.5 mt-1 mx-auto rounded-full ${item.color.includes('diamond') ? 'bg-cyan-400' : item.color.includes('green') ? 'bg-green-400' : item.color.includes('yellow') ? 'bg-yellow-400' : 'bg-red-400'}`}
                              initial={{ width: 0 }}
                              animate={{ width: "50%" }}
                              transition={{ delay: 1.3 + index * 0.15, duration: 0.4 }}
                            />
                          </div>
                          
                          {/* Example with typewriter effect on hover */}
                          <div className="text-sm text-muted-foreground italic group-hover:text-foreground/80 transition-colors">
                            "{item.example}"
                          </div>
                          
                          {/* Description */}
                          <motion.div 
                            className="text-xs text-muted-foreground/80 group-hover:text-muted-foreground transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 + index * 0.15 }}
                          >
                            {item.desc}
                          </motion.div>
                          
                          {/* Bottom glow line */}
                          <motion.div
                            className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full ${item.color.includes('diamond') ? 'bg-cyan-400' : item.color.includes('green') ? 'bg-green-400' : item.color.includes('yellow') ? 'bg-yellow-400' : 'bg-red-400'}`}
                            initial={{ width: 0, opacity: 0 }}
                            whileHover={{ width: "80%", opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.div>
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
                    transition={{ delay: 0.8 }}
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

      {/* Beta Banner Footer */}
      <BetaBanner variant="footer" />

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">MAI Pulse</span>
            <span className="mx-2 opacity-30">•</span>
            Powered by the MAI Protocol
          </p>
          <button
            onClick={() => setShowContactModal(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Us
          </button>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};

export default Index;
