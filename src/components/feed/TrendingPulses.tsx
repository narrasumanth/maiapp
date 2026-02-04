import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Flame, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
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

export const TrendingPulses = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<TrendingPulse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Fetch entities with recent score changes
        const { data: entities, error } = await supabase
          .from("entity_scores")
          .select(`
            id,
            score,
            entity_id,
            created_at,
            entities (
              id,
              name,
              category
            )
          `)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error("Error fetching trending:", error);
          setIsLoading(false);
          return;
        }

        if (entities && entities.length > 0) {
          // Group by entity and calculate changes
          const entityMap = new Map<string, any[]>();
          entities.forEach((score) => {
            if (score.entities) {
              const key = score.entity_id;
              if (!entityMap.has(key)) {
                entityMap.set(key, []);
              }
              entityMap.get(key)?.push(score);
            }
          });

          const trendingData: TrendingPulse[] = [];
          entityMap.forEach((scores, entityId) => {
            if (scores.length > 0 && scores[0].entities) {
              const latest = scores[0];
              const previous = scores.length > 1 ? scores[1] : null;
              const change = previous ? latest.score - previous.score : 0;
              const changePercent = previous 
                ? Math.round((change / previous.score) * 100) 
                : 0;

              let velocity: "rising" | "falling" | "stable" = "stable";
              if (changePercent > 5) velocity = "rising";
              else if (changePercent < -5) velocity = "falling";

              trendingData.push({
                id: entityId,
                name: latest.entities.name,
                category: latest.entities.category,
                score: latest.score,
                change,
                changePercent,
                velocity,
              });
            }
          });

          // Sort by absolute change and take top 5
          trendingData.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
          setTrending(trendingData.slice(0, 5));
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, []);

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

  // Loading state
  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-32 h-6" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  // Empty state
  if (trending.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-muted-foreground">Trending Pulses</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="w-7 h-7 text-primary" />
          </motion.div>

          <h3 className="font-medium mb-2">Trends are brewing...</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            As more people search and vote, trending pulses will appear here. 
            Be part of the first wave.
          </p>
        </motion.div>
      </GlassCard>
    );
  }

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
