import { motion } from "framer-motion";
import { Trophy, TrendingDown, MapPin, Sparkles, ArrowRight, Flame, Zap, Users, Star, Search, Shield, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "featured" | "action";
  badge?: string;
  score?: number;
  trend?: { value: number; direction: "up" | "down" };
}

const QuickAction = ({ title, description, icon, onClick, variant = "default", badge, score, trend }: QuickActionProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative group text-left rounded-2xl p-5 overflow-hidden transition-all w-full h-full",
        "backdrop-blur-xl border",
        variant === "featured" && "bg-gradient-to-br from-primary/20 via-purple-500/10 to-primary/5 border-primary/40",
        variant === "action" && "bg-gradient-to-br from-score-green/15 to-emerald-500/5 border-score-green/30",
        variant === "default" && "bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/10"
      )}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 flex items-start gap-4">
        <motion.div
          className={cn(
            "p-3 rounded-xl shrink-0",
            variant === "featured" && "bg-primary/30 text-primary shadow-lg shadow-primary/20",
            variant === "action" && "bg-score-green/25 text-score-green shadow-lg shadow-score-green/20",
            variant === "default" && "bg-white/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/20"
          )}
          animate={isHovered ? { rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {icon}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/25 text-primary animate-pulse">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          
          {(score !== undefined || trend) && (
            <div className="flex items-center gap-3 mt-3">
              {score !== undefined && (
                <span className={cn(
                  "text-2xl font-black",
                  score >= 75 ? "text-score-green" : score >= 50 ? "text-score-yellow" : "text-score-red"
                )}>
                  {score}
                </span>
              )}
              {trend && (
                <span className={cn(
                  "text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full",
                  trend.direction === "up" ? "text-score-green bg-score-green/20" : "text-score-red bg-score-red/20"
                )}>
                  {trend.direction === "up" ? "+" : ""}{trend.value}%
                  <TrendingDown className={cn("w-3 h-3", trend.direction === "up" && "rotate-180")} />
                </span>
              )}
            </div>
          )}
        </div>

        <motion.div
          className="opacity-0 group-hover:opacity-100 transition-opacity self-center"
          initial={{ x: -5 }}
          animate={isHovered ? { x: 0 } : { x: -5 }}
        >
          <ArrowRight className="w-5 h-5 text-primary" />
        </motion.div>
      </div>
    </motion.button>
  );
};

// Spotlight Card for Daily Winner
const SpotlightCard = ({ name, score, subtitle, onClick }: { name: string; score: number; subtitle: string; onClick?: () => void }) => {
  const [pulseScore, setPulseScore] = useState(score);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScore((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(score - 3, Math.min(score + 3, prev + change));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [score]);

  return (
    <motion.button
      onClick={onClick}
      className="relative group w-full rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-score-green/25 via-emerald-900/20 to-score-green/10 border-2 border-score-green/40 shadow-2xl shadow-score-green/10"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-score-green/15 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-score-green/30 to-transparent rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-score-green/30 to-transparent rounded-tl-full" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-score-green/25 flex items-center justify-center border border-score-green/40">
              <Trophy className="w-8 h-8 text-score-green" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-score-green flex items-center justify-center shadow-lg shadow-score-green/50"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-3 h-3 text-background" />
            </motion.div>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">{name}</span>
              <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-score-green/30 text-score-green border border-score-green/40 animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="text-right">
          <motion.span
            className="text-4xl font-black text-score-green"
            key={pulseScore}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {pulseScore}
          </motion.span>
          <span className="text-lg text-muted-foreground">/100</span>
        </div>
      </div>
    </motion.button>
  );
};

export const PulseGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-6">
      {/* Main CTA Header */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Get Your MAI Score</span>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Discover your digital reputation. See what the world sees.
        </p>
      </motion.div>

      {/* Spotlight - Daily Winner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SpotlightCard
          name="Tesla"
          score={92}
          subtitle="Today's Top Score"
          onClick={() => navigate("/result?q=Tesla")}
        />
      </motion.div>

      {/* Quick Actions Grid - 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          className="h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickAction
            title="Meta"
            description="Most volatile today - trust score under review"
            icon={<Flame className="w-5 h-5" />}
            score={58}
            trend={{ value: 12, direction: "down" }}
            onClick={() => navigate("/result?q=Meta")}
          />
        </motion.div>

        <motion.div
          className="h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <QuickAction
            title="Trending Near You"
            description="3 verified spots nearby worth checking out"
            icon={<MapPin className="w-5 h-5" />}
            onClick={() => navigate("/feed")}
          />
        </motion.div>

        <motion.div
          className="h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickAction
            title="Create Your Flex Card"
            description="Generate your shareable digital identity card"
            icon={<Star className="w-5 h-5" />}
            variant="action"
            badge="New"
            onClick={() => navigate("/flex")}
          />
        </motion.div>

        <motion.div
          className="h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <QuickAction
            title="MAI Roulette"
            description="Can't decide? Let AI spin the wheel for you"
            icon={<Sparkles className="w-5 h-5" />}
            variant="featured"
            onClick={() => navigate("/roulette")}
          />
        </motion.div>
      </div>

      {/* Community Stats */}
      <motion.div
        className="flex items-center justify-center gap-8 pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium">1.2k active today</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="p-2 rounded-lg bg-score-green/10">
            <Zap className="w-4 h-4 text-score-green" />
          </div>
          <span className="font-medium">847 scores checked</span>
        </div>
      </motion.div>
    </div>
  );
};
