import { motion } from "framer-motion";
import { Trophy, TrendingDown, MapPin, Sparkles, ArrowRight, Flame, Zap, Users, Star } from "lucide-react";
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
        "relative group text-left rounded-2xl p-5 overflow-hidden transition-all w-full",
        "backdrop-blur-xl border",
        variant === "featured" && "bg-gradient-to-br from-primary/15 to-purple-500/10 border-primary/30",
        variant === "action" && "bg-gradient-to-br from-score-green/10 to-emerald-500/5 border-score-green/20",
        variant === "default" && "bg-secondary/40 border-white/10 hover:border-primary/30"
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="relative z-10 flex items-start gap-4">
        <motion.div
          className={cn(
            "p-2.5 rounded-xl shrink-0",
            variant === "featured" && "bg-primary/20 text-primary",
            variant === "action" && "bg-score-green/20 text-score-green",
            variant === "default" && "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
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
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/20 text-primary">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
          
          {(score !== undefined || trend) && (
            <div className="flex items-center gap-3 mt-2">
              {score !== undefined && (
                <span className={cn(
                  "text-lg font-bold",
                  score >= 75 ? "text-score-green" : score >= 50 ? "text-score-yellow" : "text-score-red"
                )}>
                  {score}
                </span>
              )}
              {trend && (
                <span className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  trend.direction === "up" ? "text-score-green" : "text-score-red"
                )}>
                  {trend.direction === "up" ? "+" : ""}{trend.value}%
                  <TrendingDown className={cn("w-3 h-3", trend.direction === "up" && "rotate-180")} />
                </span>
              )}
            </div>
          )}
        </div>

        <motion.div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ x: -5 }}
          animate={isHovered ? { x: 0 } : { x: -5 }}
        >
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
      className="relative group w-full rounded-2xl p-6 overflow-hidden bg-gradient-to-br from-score-green/20 via-secondary/40 to-emerald-900/20 border border-score-green/30"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-score-green/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-score-green/20 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-score-green" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-score-green flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-2.5 h-2.5 text-background" />
            </motion.div>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{name}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-score-green/20 text-score-green animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="text-right">
          <motion.span
            className="text-3xl font-black text-score-green"
            key={pulseScore}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {pulseScore}
          </motion.span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
    </motion.button>
  );
};

export const PulseGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Today's Pulse</span>
        </div>
        <span className="text-xs text-muted-foreground">Real-time trust insights</span>
      </div>

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

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickAction
            title="Meta"
            description="Most volatile today"
            icon={<Flame className="w-5 h-5" />}
            score={58}
            trend={{ value: 12, direction: "down" }}
            onClick={() => navigate("/result?q=Meta")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <QuickAction
            title="Trending Near You"
            description="3 verified spots nearby"
            icon={<MapPin className="w-5 h-5" />}
            onClick={() => navigate("/feed")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickAction
            title="Create Your Flex Card"
            description="Share your digital identity"
            icon={<Star className="w-5 h-5" />}
            variant="action"
            badge="New"
            onClick={() => navigate("/flex")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <QuickAction
            title="MAI Roulette"
            description="Can't decide? Spin the wheel"
            icon={<Sparkles className="w-5 h-5" />}
            variant="featured"
            onClick={() => navigate("/roulette")}
          />
        </motion.div>
      </div>

      {/* Community Stats */}
      <motion.div
        className="flex items-center justify-center gap-6 pt-4 border-t border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>1.2k active today</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5" />
          <span>847 scores checked</span>
        </div>
      </motion.div>
    </div>
  );
};
