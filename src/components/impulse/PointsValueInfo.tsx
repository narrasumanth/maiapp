import { motion } from "framer-motion";
import { Zap, Gift, TrendingUp, Calendar, Vote, Crown, Sparkles, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const PointsValueInfo = () => {
  const pointsFeatures = [
    {
      icon: Vote,
      title: "Vote & Earn",
      description: "Earn 100 points for every vote you cast on profiles",
      points: "+100",
      color: "text-score-green",
      bgColor: "bg-score-green/10",
    },
    {
      icon: Calendar,
      title: "Daily Sign-in Bonus",
      description: "Log in every day to claim your daily reward",
      points: "+100",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Crown,
      title: "Weekly Jackpot Entry",
      description: "Use 5,000 points to enter the weekly grand prize lottery",
      points: "5,000",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      title: "Boost Your Score",
      description: "Spend points to boost visibility and reputation scores",
      points: "Coming",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <GlassCard className="p-6 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">MAI Points</h3>
            <p className="text-sm text-muted-foreground">Your digital currency for trust & rewards</p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Points are valuable in the digital trust economy</p>
              <p className="text-sm text-muted-foreground mt-1">
                Build your reputation, win prizes, and unlock exclusive features. The more you participate, the more you earn!
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pointsFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${feature.bgColor}`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <span className={`text-xs font-bold ${feature.color} px-2 py-0.5 rounded-full ${feature.bgColor}`}>
                      {feature.points}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Jackpot CTA */}
        <motion.div 
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-purple-500/10 border border-amber-500/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <Gift className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold">Weekly Grand Jackpot</h4>
                <p className="text-xs text-muted-foreground">Use 5,000 points to enter • Massive prizes await!</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.div>
      </div>
    </GlassCard>
  );
};

export default PointsValueInfo;
