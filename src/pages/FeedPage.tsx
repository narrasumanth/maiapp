import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Shield, Clock, AlertTriangle, Award, Flame } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const trendingItems = [
  { name: "OpenAI GPT-5", score: 88, category: "Product", trend: "up", change: "+5" },
  { name: "Shein", score: 42, category: "Product", trend: "down", change: "-8" },
  { name: "Nobu Malibu", score: 91, category: "Place", trend: "up", change: "+2" },
  { name: "Temu", score: 45, category: "Product", trend: "down", change: "-12" },
  { name: "Gordon Ramsay", score: 96, category: "Person", trend: "stable", change: "0" },
  { name: "Airbnb", score: 72, category: "Product", trend: "down", change: "-3" },
];

const liveAuditStream = [
  "Searching: Tesla Model 3",
  "Verified: Apple Vision Pro",
  "Searching: Noma Copenhagen",
  "Warning: Dropshipping Store #4821",
  "Verified: Trader Joe's",
  "Searching: New Influencer @tech_guru",
];

const topScams = [
  { name: "CryptoMoonShot.io", score: 12, warning: "Rug pull detected" },
  { name: "@luxury_deals_2024", score: 8, warning: "Fake products" },
  { name: "FreeiPhone15.click", score: 3, warning: "Phishing site" },
];

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-score-diamond";
  if (score >= 75) return "text-score-green";
  if (score >= 50) return "text-score-yellow";
  return "text-score-red";
};

const FeedPage = () => {
  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Grid Background */}
      <div className="fixed inset-0 grid-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/10 mb-4">
            <Activity className="w-4 h-4 text-score-green" />
            <span className="text-sm text-muted-foreground">Live Updates</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="neon-text-cyan">OmniPulse</span>
          </h1>
          <p className="text-muted-foreground">
            See what's being verified right now across the internet
          </p>
        </motion.div>

        {/* Live Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 overflow-hidden"
        >
          <div className="glass-card py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-score-green shrink-0">
                <div className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-wider">Live</span>
              </div>
              <div className="overflow-hidden flex-1">
                <div className="ticker whitespace-nowrap flex gap-8">
                  {[...liveAuditStream, ...liveAuditStream].map((item, i) => (
                    <span key={i} className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trending Section - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Flame className="w-5 h-5 text-score-yellow" />
                <h2 className="text-xl font-semibold">Trending Now</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {trendingItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                      {item.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      item.trend === "up" ? "text-score-green" : 
                      item.trend === "down" ? "text-score-red" : "text-muted-foreground"
                    }`}>
                      {item.trend === "up" ? <TrendingUp className="w-4 h-4" /> : 
                       item.trend === "down" ? <TrendingDown className="w-4 h-4" /> : null}
                      <span>{item.change}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Scans Today */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Today's Stats</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold neon-text">24,847</p>
                  <p className="text-sm text-muted-foreground">Entities Verified</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-semibold text-score-green">89%</p>
                    <p className="text-xs text-muted-foreground">Trusted</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-score-red">11%</p>
                    <p className="text-xs text-muted-foreground">Flagged</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Recent</h3>
              </div>
              <div className="space-y-3">
                {["2m ago", "5m ago", "8m ago"].map((time, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{time}</span>
                    <span className="text-foreground truncate">
                      {liveAuditStream[i]}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Scam Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
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

          {/* Top Rated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-score-diamond" />
                <h2 className="text-lg font-semibold">Diamond Tier</h2>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Gordon Ramsay", score: 96, category: "Chef" },
                  { name: "Apple", score: 94, category: "Brand" },
                  { name: "Eleven Madison Park", score: 93, category: "Restaurant" },
                ].map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-score-diamond/5 border border-score-diamond/20"
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
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
