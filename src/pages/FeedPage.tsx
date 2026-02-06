import { useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Activity, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/GlassCard";

// Lazy load heavy feed components
const TopSearches = lazy(() => import("@/components/feed/TopSearches"));
const TrendingPulses = lazy(() => import("@/components/feed/TrendingPulses"));
const NearbyPulses = lazy(() => import("@/components/feed/NearbyPulses"));
const GlobalInsights = lazy(() => import("@/components/feed/GlobalInsights"));
const VerifiedPulses = lazy(() => import("@/components/feed/VerifiedPulses"));
const HighRiskAlerts = lazy(() => import("@/components/feed/HighRiskAlerts"));

// Lightweight skeleton placeholder for lazy components
const FeedCardSkeleton = () => (
  <GlassCard className="p-6">
    <div className="flex items-center gap-2 mb-5">
      <Skeleton className="w-5 h-5 rounded" />
      <Skeleton className="w-28 h-6" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  </GlassCard>
);

const FeedPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCreatePulse = () => {
    navigate("/impulse?tab=events");
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Real-time</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="neon-text">Pulse Feed</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                What the world thinks right now
              </p>
            </div>

            {/* Create Pulse Button - Desktop */}
            {!isMobile && (
              <Button onClick={handleCreatePulse} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Pulse
              </Button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities, topics..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary/30 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </form>
        </motion.div>

        {/* Top Searches Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Suspense fallback={<FeedCardSkeleton />}>
            <TopSearches />
          </Suspense>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending Pulses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Suspense fallback={<FeedCardSkeleton />}>
                <TrendingPulses />
              </Suspense>
            </motion.div>

            {/* Nearby Pulses - Context Aware */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Suspense fallback={<FeedCardSkeleton />}>
                <NearbyPulses />
              </Suspense>
            </motion.div>

            {/* Verified Pulses - High Trust */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Suspense fallback={<FeedCardSkeleton />}>
                <VerifiedPulses />
              </Suspense>
            </motion.div>
          </div>

          {/* Right Column - Insights & Alerts */}
          <div className="space-y-6">
            {/* Global Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Suspense fallback={<FeedCardSkeleton />}>
                <GlobalInsights />
              </Suspense>
            </motion.div>

            {/* High Risk Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Suspense fallback={<FeedCardSkeleton />}>
                <HighRiskAlerts />
              </Suspense>
            </motion.div>
          </div>
        </div>

        {/* Floating Create Button - Mobile */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Button
              onClick={handleCreatePulse}
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg shadow-primary/25"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
