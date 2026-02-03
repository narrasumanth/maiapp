import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Shield, Zap, TrendingUp, Users, ArrowRight, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import { GlassCard } from "@/components/GlassCard";
import { analyzeReputation } from "@/lib/api/reputation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const features = [
  {
    icon: Shield,
    title: "Trust Verification",
    description: "AI-powered analysis of any entity's digital footprint",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get comprehensive trust scores in seconds",
  },
  {
    icon: TrendingUp,
    title: "Real-time Data",
    description: "Analysis based on live web data and reviews",
  },
  {
    icon: Users,
    title: "Community Intel",
    description: "See what others are verifying right now",
  },
];

interface TrendingEntity {
  id: string;
  name: string;
  category: string;
  latest_score: number;
  search_count: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingEntities, setTrendingEntities] = useState<TrendingEntity[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
      // Get latest scores for each entity
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

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsScanning(true);
  }, []);

  const handleScanComplete = useCallback(async () => {
    try {
      const response = await analyzeReputation(searchQuery);
      
      if (response.success && response.data) {
        // Save to database
        const normalizedName = searchQuery.toLowerCase().trim();
        
        // Check if entity exists
        let { data: existingEntity } = await supabase
          .from("entities")
          .select("id")
          .eq("normalized_name", normalizedName)
          .single();

        let entityId: string;

        if (existingEntity) {
          entityId = existingEntity.id;
        } else {
          // Create new entity
          const { data: newEntity, error } = await supabase
            .from("entities")
            .insert({
              name: response.data.name,
              category: response.data.category,
              normalized_name: normalizedName,
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

        // Save score
        await supabase.from("entity_scores").insert({
          entity_id: entityId,
          score: response.data.score,
          vibe_check: response.data.vibeCheck,
          summary: response.data.summary,
          evidence: response.data.evidence,
        });

        // Save search history
        await supabase.from("search_history").insert({
          query: searchQuery,
          entity_id: entityId,
        });

        // Store in session
        sessionStorage.setItem("mai-result", JSON.stringify(response.data));
        sessionStorage.setItem("mai-entity-id", entityId);
        
        navigate(`/result?q=${encodeURIComponent(searchQuery)}`);
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
  }, [navigate, searchQuery, toast]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Grid Background */}
      <div className="fixed inset-0 grid-background pointer-events-none" />
      
      {/* Radial Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Section - Redesigned */}
        <motion.div
          className="text-center max-w-4xl mx-auto pt-8 md:pt-16 pb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Status Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/30 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Trust Analysis</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Verify Before You</span>
            <br />
            <span className="neon-text">Trust</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Instantly scan any person, product, or business. Get an AI-powered trust score and make confident decisions.
          </p>

          {/* Search or Scanning */}
          {!isScanning ? (
            <div className="max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
              
              {/* Quick Search Suggestions */}
              {recentSearches.length > 0 && (
                <motion.div 
                  className="flex flex-wrap justify-center gap-2 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
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
            </div>
          ) : (
            <ScanningAnimation 
              isScanning={isScanning} 
              onComplete={handleScanComplete} 
            />
          )}
        </motion.div>

        {/* Features Grid - Compact */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              variant="hover"
              className="p-4 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3 md:mb-4">
                <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">{feature.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">{feature.description}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Trending Section */}
        {trendingEntities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recently Scanned
              </h2>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trendingEntities.map((item, index) => (
                <GlassCard
                  key={item.id}
                  variant="hover"
                  className="p-4 cursor-pointer"
                  onClick={() => handleSearch(item.name)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {item.category}
                      </p>
                      <p className="font-semibold truncate">{item.name}</p>
                    </div>
                    <div className={`text-2xl font-bold shrink-0 ml-3 ${
                      item.latest_score >= 90 ? "text-score-diamond" :
                      item.latest_score >= 75 ? "text-score-green" :
                      item.latest_score >= 50 ? "text-score-yellow" :
                      "text-score-red"
                    }`}>
                      {item.latest_score}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <GlassCard variant="glow" className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Never Get Scammed Again</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join thousands of users who verify before they trust. Sign up for free to unlock all features.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="btn-neon px-6 py-3">
                Get Started Free
              </button>
              <button className="btn-glass px-6 py-3 flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Try a Search
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
