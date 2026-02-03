import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Hash, Clock, Search, Sparkles, Users, Loader2, Award, AlertTriangle, Activity, Flame, MapPin, Navigation } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";

interface TrendingEntity {
  id: string;
  name: string;
  category: string;
  score: number;
  search_count: number;
  distance?: number;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-score-diamond";
  if (score >= 75) return "text-score-green";
  if (score >= 50) return "text-score-yellow";
  return "text-score-red";
};

const getScoreBg = (score: number) => {
  if (score >= 90) return "bg-score-diamond/20";
  if (score >= 75) return "bg-score-green/20";
  if (score >= 50) return "bg-score-yellow/20";
  return "bg-score-red/20";
};

const FeedPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "nearby">("trending");
  const [trendingEntities, setTrendingEntities] = useState<TrendingEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (activeTab === "nearby") {
      requestLocation();
    }
  }, [activeTab]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError("Unable to get your location. Please enable location services.");
      }
    );
  };

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
    { id: "nearby" as const, label: "Near Me", icon: MapPin },
  ];

  // Placeholder data
  const displayEntities = trendingEntities.length > 0 ? trendingEntities : [
    { id: "1", name: "Tesla", category: "Company", score: 78, search_count: 1250 },
    { id: "2", name: "ChatGPT", category: "Product", score: 92, search_count: 3400 },
    { id: "3", name: "Airbnb", category: "Service", score: 71, search_count: 890 },
    { id: "4", name: "Gordon Ramsay", category: "Person", score: 96, search_count: 450 },
    { id: "5", name: "Shein", category: "Brand", score: 42, search_count: 2100 },
    { id: "6", name: "Trader Joe's", category: "Restaurant", score: 89, search_count: 670 },
    { id: "7", name: "The Last of Us", category: "Show", score: 94, search_count: 1800 },
    { id: "8", name: "Oppenheimer", category: "Movie", score: 91, search_count: 2300 },
  ];

  const nearbyPlaceholder = [
    { id: "n1", name: "Joe's Coffee", category: "Cafe", score: 87, search_count: 120, distance: 0.3 },
    { id: "n2", name: "The Local Bar", category: "Bar", score: 72, search_count: 85, distance: 0.5 },
    { id: "n3", name: "Pizza Palace", category: "Restaurant", score: 91, search_count: 340, distance: 0.8 },
    { id: "n4", name: "Quick Cuts", category: "Barber", score: 68, search_count: 45, distance: 1.2 },
    { id: "n5", name: "Green Grocers", category: "Store", score: 94, search_count: 210, distance: 1.5 },
  ];

  const placeholderHashtags = [
    { id: "1", tag: "ScamAlert", post_count: 156 },
    { id: "2", tag: "TrustedBrand", post_count: 89 },
    { id: "3", tag: "VerifiedReview", post_count: 234 },
    { id: "4", tag: "MAIProtocol", post_count: 67 },
    { id: "5", tag: "FakeSpotted", post_count: 45 },
  ];

  const topScams = [
    { name: "CryptoMoonShot.io", score: 12, warning: "Rug pull detected" },
    { name: "@luxury_deals_2024", score: 8, warning: "Fake products" },
    { name: "FreeiPhone15.click", score: 3, warning: "Phishing site" },
  ];

  const getDisplayData = () => {
    if (activeTab === "nearby") {
      return nearbyPlaceholder;
    }
    return displayEntities;
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="fixed inset-0 grid-background pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/10 mb-4">
            <Activity className="w-4 h-4 text-score-green" />
            <span className="text-sm text-muted-foreground">Live Updates</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="neon-text">OmniPulse</span>
          </h1>
          <p className="text-muted-foreground">
            Discover what the community is verifying right now
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities, hashtags..."
              className="w-full pl-12 pr-4 py-3 rounded-xl glass-card border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>
        </motion.div>

        {/* Tabs - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 p-1.5 glass-card rounded-2xl mb-6 w-fit"
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

        {/* Location Banner for Nearby */}
        {activeTab === "nearby" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {userLocation ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-score-green/10 border border-score-green/20">
                <Navigation className="w-4 h-4 text-score-green" />
                <span className="text-sm text-score-green">Location enabled - showing results near you</span>
              </div>
            ) : locationError ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-score-yellow/10 border border-score-yellow/20">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-score-yellow" />
                  <span className="text-sm text-score-yellow">{locationError}</span>
                </div>
                <button 
                  onClick={requestLocation}
                  className="text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary">Getting your location...</span>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="w-5 h-5 text-score-yellow" />
                  <h2 className="text-xl font-semibold">
                    {activeTab === "trending" ? "Trending Now" : 
                     activeTab === "recent" ? "Recently Scanned" : 
                     "Near You"}
                  </h2>
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
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary group-hover:bg-primary/20 transition-colors">
                            {index + 1}
                          </div>
                          
                          <div>
                            <p className="font-semibold">{entity.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              {entity.category}
                              {'distance' in entity && entity.distance && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary">{entity.distance} mi away</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className={`px-4 py-2 rounded-xl ${getScoreBg(entity.score)}`}>
                          <span className={`text-2xl font-bold ${getScoreColor(entity.score)}`}>
                            {entity.score}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Scam Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6 border-score-red/20">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-5 h-5 text-score-red" />
                  <h2 className="text-xl font-semibold">Scam Alert Board</h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {topScams.map((scam, index) => (
                    <motion.div
                      key={scam.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 rounded-xl bg-score-red/10 border border-score-red/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl font-bold text-score-red">{scam.score}</span>
                        <AlertTriangle className="w-4 h-4 text-score-red" />
                      </div>
                      <p className="font-medium text-sm truncate">{scam.name}</p>
                      <p className="text-xs text-score-red/80 mt-1">{scam.warning}</p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Hashtags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" />
                  Trending Tags
                </h3>
                <div className="space-y-2">
                  {placeholderHashtags.map((hashtag, index) => (
                    <motion.button
                      key={hashtag.id}
                      onClick={() => setSearchQuery(hashtag.tag)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.4 }}
                    >
                      <span className="text-primary">#{hashtag.tag}</span>
                      <span className="text-sm text-muted-foreground">{hashtag.post_count}</span>
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Diamond Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-score-diamond" />
                  <h2 className="text-lg font-semibold">Diamond Tier</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Gordon Ramsay", score: 96, category: "Chef" },
                    { name: "Apple", score: 94, category: "Brand" },
                    { name: "Eleven Madison Park", score: 93, category: "Restaurant" },
                  ].map((item, index) => (
                    <div
                      key={item.name}
                      onClick={() => handleEntityClick(item.name)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-score-diamond/5 border border-score-diamond/20 cursor-pointer hover:bg-score-diamond/10 transition-colors"
                    >
                      <span className="text-lg font-bold text-score-diamond">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <span className="text-score-diamond font-semibold">{item.score}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* What's Your Score CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard variant="glow" className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-neon-gradient flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">What's Your Score?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search yourself and claim your profile to manage your online reputation.
                </p>
                <button 
                  onClick={() => navigate("/")}
                  className="btn-neon w-full"
                >
                  Get MAI Score
                </button>
              </GlassCard>
            </motion.div>

            {/* Earn Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-3">Earn Points</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vote Yay/Nay</span>
                    <span className="text-primary font-medium">+5 pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Follow a profile</span>
                    <span className="text-primary font-medium">+2 pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Review nearby</span>
                    <span className="text-score-green font-medium">+10 pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Get verified</span>
                    <span className="text-primary font-medium">+50 pts</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="btn-glass w-full mt-4"
                >
                  Sign In to Earn
                </button>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default FeedPage;
