import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface TrendingPulse {
  id: string;
  name: string;
  category: string;
  score: number;
  change: number;
  changePercent: number;
  velocity: "rising" | "falling" | "stable";
  tags?: string[];
}

// Simulated trending data with momentum
const mockTrending: TrendingPulse[] = [
  { id: "1", name: "New iPhone Update", category: "Product", score: 62, change: -14, changePercent: -18, velocity: "falling", tags: ["Buggy", "Battery drain"] },
  { id: "2", name: "SpaceX Starship", category: "Company", score: 89, change: 12, changePercent: 16, velocity: "rising", tags: ["Successful launch"] },
  { id: "3", name: "Local Coffee Chain", category: "Business", score: 78, change: 0, changePercent: 0, velocity: "stable" },
  { id: "4", name: "Streaming Service X", category: "Service", score: 45, change: -22, changePercent: -33, velocity: "falling", tags: ["Price increase", "Content removed"] },
  { id: "5", name: "New Restaurant Downtown", category: "Food", score: 92, change: 8, changePercent: 10, velocity: "rising", tags: ["Great reviews"] },
];

export const TrendingPulses = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<TrendingPulse[]>(mockTrending);

  const getVelocityIcon = (velocity: string) => {
    switch (velocity) {
      case "rising":
        return <TrendingUp className="w-4 h-4 text-score-green" />;
      case "falling":
        return <TrendingDown className="w-4 h-4 text-score-red" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-score-green";
    if (change < 0) return "text-score-red";
    return "text-muted-foreground";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-score-green";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Trending Pulses</h2>
        </div>
        <span className="text-xs text-muted-foreground">Rapid changes today</span>
      </div>

      <div className="space-y-3">
        {trending.map((pulse, index) => (
          <motion.div
            key={pulse.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(pulse.name)}
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all group",
              "bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-primary/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getVelocityIcon(pulse.velocity)}
                  <span className="font-semibold truncate">{pulse.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{pulse.category}</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Change indicator */}
                <div className="text-right">
                  <div className={cn("text-sm font-bold", getChangeColor(pulse.change))}>
                    {pulse.change > 0 ? "+" : ""}{pulse.changePercent}%
                  </div>
                  <span className="text-xs text-muted-foreground">today</span>
                </div>

                {/* Score */}
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  "bg-secondary/40 group-hover:bg-secondary/60 transition-colors"
                )}>
                  <motion.span
                    className={cn("text-xl font-black", getScoreColor(pulse.score))}
                    animate={pulse.velocity !== "stable" ? { 
                      scale: [1, 1.05, 1],
                      opacity: [1, 0.8, 1]
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {pulse.score}
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {pulse.tags && pulse.tags.length > 0 && (
              <div className="flex gap-2 mt-3">
                {pulse.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      pulse.velocity === "falling" 
                        ? "bg-score-red/10 text-score-red" 
                        : "bg-score-green/10 text-score-green"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => navigate("/feed?view=trending")}
        className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
      >
        View all trending
        <ArrowRight className="w-4 h-4" />
      </button>
    </GlassCard>
  );
};
