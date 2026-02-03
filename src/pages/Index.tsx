import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, TrendingUp, Users, ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import { GlassCard } from "@/components/GlassCard";
import { analyzeReputation } from "@/lib/api/reputation";
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

const recentSearches = [
  { name: "Tesla Cybertruck", score: 78, category: "Product" },
  { name: "Sushi Nakazawa", score: 94, category: "Place" },
  { name: "Temu", score: 45, category: "Product" },
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsScanning(true);
  }, []);

  const handleScanComplete = useCallback(async () => {
    try {
      const response = await analyzeReputation(searchQuery);
      
      if (response.success && response.data) {
        // Store result in session storage for the result page
        sessionStorage.setItem("mai-result", JSON.stringify(response.data));
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
        {/* Hero Section */}
        <motion.div
          className="text-center max-w-4xl mx-auto pt-16 pb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/10 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
            <span className="text-sm text-muted-foreground">Powered by Advanced AI</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">A Credit Score for</span>
            <br />
            <span className="neon-text">the Internet</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Instantly verify the reputation of any person, place, or product. 
            Make confident decisions with AI-powered trust analysis.
          </p>

          {/* Search or Scanning */}
          {!isScanning ? (
            <SearchBar onSearch={handleSearch} />
          ) : (
            <ScanningAnimation 
              isScanning={isScanning} 
              onComplete={handleScanComplete} 
            />
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              variant="hover"
              className="p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.4 }}
            >
              <div className="w-12 h-12 rounded-xl bg-neon-gradient/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Recent Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Trending Searches</h2>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {recentSearches.map((item, index) => (
              <GlassCard
                key={item.name}
                variant="hover"
                className="p-5 cursor-pointer"
                onClick={() => handleSearch(item.name)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {item.category}
                    </p>
                    <p className="font-semibold text-lg">{item.name}</p>
                  </div>
                  <div className={`text-2xl font-bold ${
                    item.score >= 90 ? "text-score-diamond" :
                    item.score >= 75 ? "text-score-green" :
                    item.score >= 50 ? "text-score-yellow" :
                    "text-score-red"
                  }`}>
                    {item.score}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
