import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Globe,
  Search,
  Star,
  Eye,
  ChevronRight
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import { EntityDisambiguation } from "@/components/result/EntityDisambiguation";
import { GlassCard } from "@/components/GlassCard";
import { analyzeReputation, checkDisambiguation, DisambiguationOption } from "@/lib/api/reputation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrendingEntity {
  id: string;
  name: string;
  category: string;
  latest_score: number;
  search_count: number;
}

interface EntityOption extends DisambiguationOption {
  // Extended from DisambiguationOption
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingEntities, setTrendingEntities] = useState<TrendingEntity[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationOptions, setDisambiguationOptions] = useState<EntityOption[]>([]);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState<DisambiguationOption | undefined>();
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | undefined>();

  useEffect(() => {
    fetchTrending();
    fetchRecentSearches();
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
        .in("entity_id", entityIds)
        .order("created_at", { ascending: false });

      const scoreMap = new Map<string, number>();
      scores?.forEach(s => {
        if (!scoreMap.has(s.entity_id)) {
          scoreMap.set(s.entity_id, s.score);
        }
      });

      const trending = entities.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        latest_score: scoreMap.get(e.id) || 75,
        search_count: 0,
      }));

      setTrendingEntities(trending);
    }
  };

  const fetchRecentSearches = async () => {
    const { data } = await supabase
      .from("search_history")
      .select("query")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const uniqueQueries = [...new Set(data.map(s => s.query))].slice(0, 5);
      setRecentSearches(uniqueQueries);
    }
  };

  const checkForMultipleResults = async (query: string): Promise<{ options: EntityOption[]; clarifyingQuestion?: string }> => {
    // First check existing entities in database
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

    // If no existing entities or only one, check with AI for potential ambiguity
    try {
      const disambiguationResult = await checkDisambiguation(query);
      
      if (disambiguationResult.isAmbiguous && disambiguationResult.options.length > 0) {
        return {
          options: disambiguationResult.options,
          clarifyingQuestion: disambiguationResult.clarifyingQuestion,
        };
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
    
    // Show a loading state briefly while checking disambiguation
    toast({
      title: "Checking...",
      description: "Looking for matching entities",
    });
    
    // Check for multiple results first
    const { options: multipleResults, clarifyingQuestion: question } = await checkForMultipleResults(query);
    
    if (multipleResults.length > 1) {
      // Add a "New search" option
      const optionsWithNew: EntityOption[] = [
        ...multipleResults,
        {
          id: "new",
          name: query,
          category: "New Search",
          description: "Search for this as a new entity (skip disambiguation)",
        }
      ];
      setDisambiguationOptions(optionsWithNew);
      setClarifyingQuestion(question);
      setShowDisambiguation(true);
    } else {
      // Proceed with scanning
      setIsScanning(true);
    }
  }, [toast]);

  const handleDisambiguationSelect = useCallback(async (option: EntityOption) => {
    setShowDisambiguation(false);
    
    if (option.id === "new") {
      // Fresh search without disambiguation context
      setSelectedDisambiguation(undefined);
      setIsScanning(true);
    } else if (option.id.startsWith("ai-")) {
      // AI-generated option - do fresh scan with this context
      setSelectedDisambiguation(option);
      setSearchQuery(option.name);
      setIsScanning(true);
    } else {
      // Load existing entity from database
      const { data: scores } = await supabase
        .from("entity_scores")
        .select("*")
        .eq("entity_id", option.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (scores) {
        // Parse evidence safely
        let evidence: any[] = [];
        if (scores.evidence) {
          try {
            evidence = Array.isArray(scores.evidence) ? scores.evidence : [];
          } catch {
            evidence = [];
          }
        }

        const result = {
          name: option.name,
          category: option.category,
          score: scores.score,
          summary: scores.summary || "",
          vibeCheck: scores.vibe_check || "",
          evidence,
        };

        sessionStorage.setItem("mai-result", JSON.stringify(result));
        sessionStorage.setItem("mai-entity-id", option.id);
        navigate(`/result?q=${encodeURIComponent(option.name)}`);
      } else {
        // No scores, do fresh scan with entity context
        setSelectedDisambiguation(option);
        setSearchQuery(option.name);
        setIsScanning(true);
      }
    }
  }, [navigate]);

  const handleDisambiguationBack = useCallback(() => {
    setShowDisambiguation(false);
    setDisambiguationOptions([]);
  }, []);

  const handleScanComplete = useCallback(async () => {
    try {
      // Pass the selected disambiguation option for context
      const response = await analyzeReputation(searchQuery, selectedDisambiguation);
      
      if (response.success && response.data) {
        // Create a unique cache key if disambiguation was used
        const normalizedName = selectedDisambiguation 
          ? `${searchQuery.toLowerCase().trim()}|${selectedDisambiguation.id}`
          : searchQuery.toLowerCase().trim();
        
        let { data: existingEntity } = await supabase
          .from("entities")
          .select("id")
          .eq("normalized_name", normalizedName)
          .single();

        let entityId: string;

        if (existingEntity) {
          entityId = existingEntity.id;
        } else {
          // Include metadata from disambiguation if available
          const entityMetadata = selectedDisambiguation?.metadata || response.data.metadata || {};
          
          const { data: newEntity, error } = await supabase
            .from("entities")
            .insert({
              name: selectedDisambiguation?.name || response.data.name,
              category: response.data.category,
              normalized_name: normalizedName,
              about: selectedDisambiguation?.description,
              metadata: entityMetadata,
            })
            .select("id")
            .single();

          if (error || !newEntity) {
            console.error("Error creating entity:", error);
            entityId = crypto.randomUUID();
          } else {
            entityId = newEntity.id;
          }
        }

        await supabase.from("entity_scores").insert({
          entity_id: entityId,
          score: response.data.score,
          vibe_check: response.data.vibeCheck,
          summary: response.data.summary,
          evidence: response.data.evidence,
        });

        // Use the display name from disambiguation if available
        const displayName = selectedDisambiguation?.name || searchQuery;
        
        await supabase.from("search_history").insert({
          query: displayName,
          entity_id: entityId,
        });

        sessionStorage.setItem("mai-result", JSON.stringify(response.data));
        sessionStorage.setItem("mai-entity-id", entityId);
        
        // Clear disambiguation state
        setSelectedDisambiguation(undefined);
        
        navigate(`/result?q=${encodeURIComponent(displayName)}`);
      } else {
        toast({
          title: "Analysis Failed",
          description: response.error || "Could not analyze this entity. Please try again.",
          variant: "destructive",
        });
        setIsScanning(false);
      }
    } catch (error) {
      console.error("Error during scan:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  }, [navigate, searchQuery, selectedDisambiguation, toast]);

  // Placeholder data when no real data
  const displayTrending = trendingEntities.length > 0 ? trendingEntities : [
    { id: "1", name: "Tesla", category: "Company", latest_score: 78, search_count: 1250 },
    { id: "2", name: "ChatGPT", category: "Product", latest_score: 92, search_count: 3400 },
    { id: "3", name: "Airbnb", category: "Service", latest_score: 71, search_count: 890 },
    { id: "4", name: "Gordon Ramsay", category: "Person", latest_score: 96, search_count: 450 },
    { id: "5", name: "Shein", category: "Brand", latest_score: 42, search_count: 2100 },
    { id: "6", name: "Trader Joe's", category: "Store", latest_score: 89, search_count: 670 },
  ];

  const stats = [
    { value: "2.4M+", label: "Entities Analyzed", icon: Eye },
    { value: "99.2%", label: "Accuracy Rate", icon: Shield },
    { value: "< 3s", label: "Analysis Time", icon: Zap },
    { value: "156K+", label: "Active Users", icon: Users },
  ];

  return (
    <div className="min-h-screen pt-16 pb-12 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-background opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Section */}
        <motion.div
          className="text-center max-w-5xl mx-auto pt-12 md:pt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Floating Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card border border-primary/30 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
            <span className="text-sm font-medium text-foreground/80">AI-Powered Trust Intelligence</span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="text-foreground">Know Before</span>
            <br />
            <span className="neon-text">You Trust</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Instantly verify the reputation of any person, business, or product.
            AI analyzes millions of data points to give you a trust score.
          </p>

          {/* Search Section with Disambiguation */}
          <AnimatePresence mode="wait">
            {showDisambiguation ? (
              <motion.div
                key="disambiguation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
              <EntityDisambiguation
                  query={searchQuery}
                  options={disambiguationOptions}
                  onSelect={handleDisambiguationSelect}
                  onBack={handleDisambiguationBack}
                  clarifyingQuestion={clarifyingQuestion}
                />
              </motion.div>
            ) : !isScanning ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <SearchBar onSearch={handleSearch} />
                
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <motion.div 
                    className="flex flex-wrap justify-center gap-2 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-sm text-muted-foreground mr-2">Recent:</span>
                    {recentSearches.slice(0, 4).map((query, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(query)}
                        className="px-3 py-1.5 text-sm glass-card border-white/10 hover:border-primary/30 transition-all rounded-full"
                      >
                        {query}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ScanningAnimation 
                  isScanning={isScanning} 
                  searchQuery={searchQuery}
                  onComplete={handleScanComplete} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Bar - Hidden during scanning/disambiguation */}
        {!isScanning && !showDisambiguation && (
          <motion.div
            className="flex flex-wrap justify-center gap-6 md:gap-12 my-16 md:my-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold neon-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                  <stat.icon className="w-3.5 h-3.5" />
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* How It Works - Hidden during scanning/disambiguation */}
        {!isScanning && !showDisambiguation && (
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">How MAI Score Works</h2>
              <p className="text-muted-foreground">Three simple steps to verify anyone</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { step: "01", icon: Search, title: "Search", desc: "Enter any name, brand, or URL" },
                { step: "02", icon: Globe, title: "Analyze", desc: "AI scans 50+ data sources" },
                { step: "03", icon: Star, title: "Score", desc: "Get instant trust rating 0-100" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <GlassCard variant="hover" className="p-6 text-center h-full">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-xs text-primary font-bold mb-2">{item.step}</div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </GlassCard>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trending Section - Hidden during scanning/disambiguation */}
        {!isScanning && !showDisambiguation && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Trending Now
              </h2>
              <button 
                onClick={() => navigate("/feed")}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayTrending.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.8 }}
                >
                  <GlassCard
                    variant="hover"
                    className="p-5 cursor-pointer"
                    onClick={() => handleSearch(item.name)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary/50" />
                          {item.category}
                        </p>
                        <p className="font-bold text-lg truncate">{item.name}</p>
                      </div>
                      <div className={`text-3xl font-black shrink-0 ml-4 ${
                        item.latest_score >= 90 ? "text-score-diamond" :
                        item.latest_score >= 75 ? "text-score-green" :
                        item.latest_score >= 50 ? "text-score-yellow" :
                        "text-score-red"
                      }`}>
                        {item.latest_score}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section - Hidden during scanning/disambiguation */}
        {!isScanning && !showDisambiguation && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-20"
          >
            <GlassCard variant="glow" className="p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Never Get Scammed Again</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  Join 156K+ users who verify before they trust. It's completely free.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => document.querySelector('input')?.focus()}
                    className="btn-neon px-8 py-4 text-lg"
                  >
                    Get Your MAI Score
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
