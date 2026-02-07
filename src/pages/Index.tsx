import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Shield, TrendingUp } from "lucide-react";
import { HeroSearchBar } from "@/components/home/HeroSearchBar";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { VisionTeaser } from "@/components/home/VisionTeaser";
import { SearchLimitModal } from "@/components/SearchLimitModal";
import { AuthModal } from "@/components/auth/AuthModal";

import { analyzeReputation, checkDisambiguation, DisambiguationOption } from "@/lib/api/reputation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load heavy components - only needed during search flow
const ProgressiveScanLoader = lazy(() => import("@/components/ProgressiveScanLoader").then(m => ({ default: m.ProgressiveScanLoader })));
const MatchingEntries = lazy(() => import("@/components/MatchingEntries").then(m => ({ default: m.MatchingEntries })));
const ScoreRevealAnimation = lazy(() => import("@/components/ScoreRevealAnimation").then(m => ({ default: m.ScoreRevealAnimation })));
const ContactModal = lazy(() => import("@/components/contact/ContactModal").then(m => ({ default: m.ContactModal })));

// Simple loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);



const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isScanning, setIsScanning] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationOptions, setDisambiguationOptions] = useState<DisambiguationOption[]>([]);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState<DisambiguationOption | undefined>();
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | undefined>();
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ isAuthenticated: boolean; limit: number } | null>(null);
  const processedSearchRef = useRef<string | null>(null);

  // Handle search param from URL (e.g., from Feed page clicks)
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch && urlSearch !== processedSearchRef.current && !isScanning && !showReveal) {
      processedSearchRef.current = urlSearch;
      // Clear the search param to avoid re-triggering
      setSearchParams({}, { replace: true });
      handleSearch(urlSearch);
    }
  }, [searchParams, isScanning, showReveal]);



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
    
    if (option.id === "new" || option.id.startsWith("context-")) {
      setSelectedDisambiguation(undefined);
      setIsScanning(true);
      // Use the option name which may contain context
      const queryToUse = option.id.startsWith("context-") ? option.name : searchQuery;
      startAnalysis(queryToUse);
    } else if (option.id.startsWith("ai-")) {
      setSelectedDisambiguation(option);
      setSearchQuery(option.name);
      setIsScanning(true);
      startAnalysis(option.name, option);
    } else {
      // First check cache for complete data including fun facts
      const { data: cachedData } = await supabase
        .from("entity_score_cache")
        .select("*")
        .ilike("entity_name", option.name)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (cachedData) {
        const result = {
          name: cachedData.entity_name,
          category: cachedData.category,
          score: cachedData.score,
          summary: cachedData.summary || "",
          vibeCheck: cachedData.vibe_check || "",
          evidence: Array.isArray(cachedData.evidence) ? cachedData.evidence : [],
          funFact: cachedData.fun_fact || undefined,
          hardFact: cachedData.hard_fact || undefined,
          metadata: cachedData.metadata || {},
        };
        setPendingResult({ result, entityId: option.id, displayName: option.name });
        setShowReveal(true);
      } else {
        // Fallback to entity_scores if no cache
        const { data: scores } = await supabase
          .from("entity_scores")
          .select("*")
          .eq("entity_id", option.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

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

        // Log search without blocking - geo lookup done async in background
        const displayName = disambiguation?.name || query;
        
        // Fire-and-forget: insert search history and fetch geo data in background
        (async () => {
          let locationData: { country?: string; city?: string; ip_hash?: string } = {};
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
            const geoRes = await fetch("https://ipapi.co/json/", { signal: controller.signal });
            clearTimeout(timeoutId);
            if (geoRes.ok) {
              const geo = await geoRes.json();
              const ipHash = await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(geo.ip || "unknown")
              );
              locationData = {
                country: geo.country_name || geo.country,
                city: geo.city,
                ip_hash: Array.from(new Uint8Array(ipHash))
                  .map(b => b.toString(16).padStart(2, "0"))
                  .join(""),
              };
            }
          } catch {
            // Geo lookup failed or timed out - continue without location
          }
          
          try {
            await supabase.from("search_history").insert({
              query: displayName,
              entity_id: entityId,
              ...locationData,
            });
          } catch {
            // Ignore insert errors
          }
        })();

        setIsScanning(false);
        setPendingResult({ result: response.data, entityId, displayName });
        setShowReveal(true);
      } else {
        // Handle search limit reached
        if (response.error === "SEARCH_LIMIT_REACHED" || response.error?.includes("SEARCH_LIMIT")) {
          setIsScanning(false);
          setLimitInfo(response.limitInfo || { isAuthenticated: false, limit: 75 });
          setShowLimitModal(true);
          return;
        }
        
        // Provide clear, user-friendly error messages
        let errorTitle = "Analysis Failed";
        let errorDescription = response.error || "Could not analyze this entity.";
        
        // Customize messages based on error type
        if (response.error?.includes("timed out") || response.error?.includes("Timeout")) {
          errorTitle = "Request Timed Out";
          errorDescription = "The analysis is taking too long. Please try again in a moment.";
        } else if (response.error?.includes("not configured") || response.error?.includes("service")) {
          errorTitle = "Service Unavailable";
          errorDescription = "Our analysis service is temporarily unavailable. Please try again later.";
        } else if (response.error?.includes("Network") || response.error?.includes("connection") || response.error?.includes("Failed to fetch")) {
          errorTitle = "Connection Error";
          errorDescription = "Please check your internet connection and try again.";
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        setIsScanning(false);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Unexpected Error",
        description: error?.message || "Something went wrong. Please refresh the page and try again.",
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
      {/* Lazy load score reveal - only shown during reveal */}
      {showReveal && (
        <Suspense fallback={<LoadingFallback />}>
          <ScoreRevealAnimation 
            isVisible={showReveal} 
            searchQuery={searchQuery}
            targetScore={pendingResult?.result?.score}
            onReveal={handleReveal}
          />
        </Suspense>
      )}

      <PulseWaveBackground />

      <main className="flex-1 flex flex-col relative z-10">
        {showDisambiguation ? (
          <div className="flex-1 flex items-center justify-center px-4 pt-20 animate-fade-in">
            <Suspense fallback={<LoadingFallback />}>
              <MatchingEntries
                query={searchQuery}
                options={disambiguationOptions}
                onSelect={handleDisambiguationSelect}
                onBack={() => {
                  setShowDisambiguation(false);
                  setDisambiguationOptions([]);
                }}
                clarifyingQuestion={clarifyingQuestion}
                onSearchWithContext={(originalQuery, context) => {
                  const enrichedQuery = `${originalQuery} (${context})`;
                  setSearchQuery(enrichedQuery);
                  setShowDisambiguation(false);
                  setIsScanning(true);
                  startAnalysis(enrichedQuery);
                }}
              />
            </Suspense>
          </div>
        ) : isScanning || showReveal ? (
          <div className="flex-1 flex items-center justify-center px-4 pt-20 animate-fade-in">
            <Suspense fallback={<LoadingFallback />}>
              <ProgressiveScanLoader searchQuery={searchQuery} />
            </Suspense>
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-fade-in">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 min-h-[70vh]">
              <div className="max-w-3xl mx-auto text-center space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 fade-in-up">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary tracking-wide">
                    AI-Powered Trust Analysis
                  </span>
                </div>

                {/* Headline */}
                <div className="space-y-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                    Know Your{" "}
                    <span className="neon-text">Real Online Pulse</span>
                  </h1>
                  
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Instantly analyze anyone's digital reputation. Get clear insights 
                    on who's trustworthy and who's not.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="pt-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <HeroSearchBar onSearch={handleSearch} />
                </div>
              </div>
            </section>

            {/* Vision Teaser */}
            <VisionTeaser />

            {/* Trending Section */}
            <section className="border-t border-border/50 bg-card/30">
              <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.3s' }}>
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
                    {trendingEntities.map((entity) => (
                      <button
                        key={entity.name}
                        onClick={() => handleSearch(entity.name)}
                        className="group flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-colors"
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
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Humor Disclaimer - simplified, no motion */}
            <section className="border-t border-border/50 bg-secondary/20">
              <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="text-center space-y-2 fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-lg mr-2">⚡</span>
                    <span className="font-medium text-foreground">Powered by real online signals and a dash of humor.</span>{" "}
                    Our AI turns data into insights with personality—mostly fun, occasionally a wake-up call when the pulse drops.
                  </p>
                </div>
              </div>
            </section>

            {/* Score Examples - simplified with CSS animations */}
            <section className="border-t border-border/50">
              <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="space-y-8">
                  <div className="text-center fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <h2 className="text-xl font-bold text-foreground mb-2">What the Scores Mean</h2>
                    <p className="text-sm text-muted-foreground">
                      Real examples of how our AI rates online reputation
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
                    {[
                      { score: 95, label: "Strong Pulse Signal", range: "86-100", example: "Warren Buffett", color: "text-score-diamond", bg: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", desc: "Exceptional trust" },
                      { score: 78, label: "Positive Pulse", range: "61-85", example: "Your Local Bank", color: "text-score-green", bg: "from-green-500/20 to-emerald-500/10", border: "border-green-500/30", desc: "Solid reputation" },
                      { score: 52, label: "Mixed Pulse", range: "40-60", example: "That Viral Startup", color: "text-score-yellow", bg: "from-yellow-500/20 to-orange-500/10", border: "border-yellow-500/30", desc: "Proceed with caution" },
                      { score: 23, label: "Low Pulse", range: "0-39", example: "Crypto Bro LLC", color: "text-score-red", bg: "from-red-500/20 to-rose-500/10", border: "border-red-500/30", desc: "High risk detected" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b ${item.bg} border ${item.border} text-center space-y-2 sm:space-y-3 hover:scale-[1.02] transition-transform duration-200`}
                      >
                        <div className={`text-3xl sm:text-4xl font-bold ${item.color}`}>{item.score}</div>
                        <div className="font-semibold text-foreground text-sm sm:text-base leading-tight">{item.label}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground/70 font-mono">{item.range}</div>
                        <div className="text-xs text-muted-foreground italic hidden sm:block">"{item.example}"</div>
                        <div className="text-xs text-muted-foreground/80">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Pulse Era Section */}
            <section className="border-t border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="text-center space-y-4 fade-in-up" style={{ animationDelay: '0.55s' }}>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    MAI Pulse reflects aggregated online sentiment. We're expanding to include{" "}
                    <span className="text-foreground font-medium">direct pulse voting from real users</span>{" "}
                    — creating a fully participatory, real-time sentiment system for everything.
                  </p>
                  <p className="text-sm text-primary font-medium">
                    Claim your profile and start building your pulse.
                  </p>
                  <p className="text-xs text-muted-foreground/80 italic">
                    This is the end of the reviews era — and the beginning of the Pulse era.
                  </p>
                </div>
              </div>
            </section>

            {/* Stats Bar - simplified */}
            <section className="border-t border-border/50">
              <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="flex items-center justify-center gap-6 sm:gap-16 text-sm fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">10k+ analyses</span>
                    <span className="sm:hidden">10k+</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Real-time data</span>
                    <span className="sm:hidden">Live</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

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
            Contact Us
          </button>
        </div>
      </footer>

      {/* Lazy loaded modals */}
      {showContactModal && (
        <Suspense fallback={null}>
          <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
        </Suspense>
      )}
      
      {/* Search Limit Modal */}
      <SearchLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        isAuthenticated={limitInfo?.isAuthenticated ?? false}
        limit={limitInfo?.limit ?? 100}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Index;
