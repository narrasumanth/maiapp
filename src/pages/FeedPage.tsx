import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Search, Loader2, AlertTriangle, Activity, Flame, MapPin, Globe, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";

interface TrendingEntity {
  id: string;
  name: string;
  category: string;
  score: number;
  search_count: number;
  isExternal?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-score-diamond";
  if (score >= 75) return "text-score-green";
  if (score >= 50) return "text-primary";
  return "text-score-red";
};

const getScoreBg = (score: number) => {
  if (score >= 90) return "bg-score-diamond/10";
  if (score >= 75) return "bg-score-green/10";
  if (score >= 50) return "bg-primary/10";
  return "bg-score-red/10";
};

const getPulseLabel = (score: number) => {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Trustworthy";
  if (score >= 50) return "Mixed Reviews";
  return "High Risk";
};

const getPulseEmoji = (score: number) => {
  if (score >= 90) return "💎";
  if (score >= 75) return "✅";
  if (score >= 50) return "⚠️";
  return "🚨";
};

// Simulated Google trending topics (would be fetched from API in production)
const googleTrending = [
  { name: "Super Bowl 2024", category: "Event", score: 85 },
  { name: "Donald Trump", category: "Person", score: 82 },
  { name: "Apple Vision Pro", category: "Product", score: 78 },
  { name: "ChatGPT 5", category: "AI", score: 88 },
  { name: "Bitcoin ETF", category: "Finance", score: 72 },
];

const FeedPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "global">("trending");
  const [trendingEntities, setTrendingEntities] = useState<TrendingEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setIsLoading(true);
    
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name, category")
      .order("updated_at", { ascending: false })
      .limit(20);

    if (entities && entities.length > 0) {
      const entityIds = entities.map(e => e.id);
      const { data: scores } = await supabase
        .from("entity_scores")
        .select("entity_id, score, search_count")
        .in("entity_id", entityIds)
        .order("created_at", { ascending: false });

      const scoreMap = new Map<string, { score: number; search_count: number }>();
      scores?.forEach(s => {
        if (!scoreMap.has(s.entity_id)) {
          scoreMap.set(s.entity_id, { score: s.score, search_count: s.search_count || 0 });
        }
      });

      const trending = entities.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        score: scoreMap.get(e.id)?.score || 75,
        search_count: scoreMap.get(e.id)?.search_count || 0,
      }));

      setTrendingEntities(trending);
    }
    
    setIsLoading(false);
  };

  const handleEntityClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  const tabs = [
    { id: "trending" as const, label: "Trending", icon: TrendingUp },
    { id: "recent" as const, label: "Recent", icon: Clock },
    { id: "global" as const, label: "Global", icon: Globe },
  ];

  // Use internal data or fallback to Google trending if empty
  const displayEntities = trendingEntities.length > 0 
    ? trendingEntities 
    : googleTrending.map((item, i) => ({ ...item, id: `google-${i}`, search_count: 0, isExternal: true }));

  const getDisplayData = () => {
    if (activeTab === "global") {
      return googleTrending.map((item, i) => ({ 
        ...item, 
        id: `google-${i}`, 
        search_count: Math.floor(Math.random() * 5000) + 1000,
        isExternal: true 
      }));
    }
    return displayEntities;
  };

  const topAlerts = [
    { name: "CryptoMoonShot.io", score: 12, warning: "Rug pull detected" },
    { name: "@luxury_deals_2024", score: 8, warning: "Fake products" },
    { name: "FreeiPhone15.click", score: 3, warning: "Phishing site" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pt-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Live Updates</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="neon-text">Pulse Feed</span>
          </h1>
          <p className="text-muted-foreground">
            Discover what's trending and who's being checked right now
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities, topics..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary/30 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 p-1.5 bg-secondary/30 border border-border/50 rounded-2xl mb-6 w-fit"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">
                      {activeTab === "trending" ? "Trending Now" : 
                       activeTab === "recent" ? "Recently Scanned" : 
                       "Global Trending"}
                    </h2>
                  </div>
                  {activeTab === "global" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Powered by web trends</span>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getDisplayData()
                      .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((entity, index) => (
                      <motion.div
                        key={entity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleEntityClick(entity.name)}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-primary/20 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary group-hover:bg-primary/20 transition-colors">
                            {index + 1}
                          </div>
                          
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {entity.name}
                              {'isExternal' in entity && entity.isExternal && (
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entity.category}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`px-3 py-1.5 rounded-lg ${getScoreBg(entity.score)}`}>
                            <span className={`text-xl font-bold ${getScoreColor(entity.score)}`}>
                              {entity.score}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                            <span>{getPulseEmoji(entity.score)}</span>
                            {getPulseLabel(entity.score)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* High Risk Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6 border-score-red/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-score-red" />
                  <h2 className="text-lg font-semibold">High Risk Alerts</h2>
                </div>

                <div className="space-y-3">
                  {topAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => handleEntityClick(alert.name)}
                      className="p-4 rounded-xl bg-score-red/5 border border-score-red/10 hover:bg-score-red/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl font-bold text-score-red">{alert.score}</span>
                        <span className="text-lg">🚨</span>
                      </div>
                      <p className="font-medium text-sm truncate">{alert.name}</p>
                      <p className="text-xs text-score-red/80 mt-1">{alert.warning}</p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Today's Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <span className="text-sm text-muted-foreground">Profiles Scanned</span>
                    <span className="font-bold text-foreground">1,247</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <span className="text-sm text-muted-foreground">New Profiles</span>
                    <span className="font-bold text-foreground">89</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <span className="text-sm text-muted-foreground">High Risk Found</span>
                    <span className="font-bold text-score-red">12</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
