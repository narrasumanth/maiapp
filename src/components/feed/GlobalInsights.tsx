import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingDown, TrendingUp, Clock, Zap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  text: string;
  change: number;
  direction: "up" | "down" | "neutral";
  category: string;
  confidence: "high" | "medium" | "low";
}

const timePatterns = [
  { label: "Peak activity", value: "7-10 PM", icon: Clock },
  { label: "Most volatile", value: "Product launches", icon: Zap },
];

export const GlobalInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Get category-level stats from entity scores
        const { data: scores, error } = await supabase
          .from("entity_scores")
          .select(`
            id,
            score,
            positive_reactions,
            negative_reactions,
            entities (category)
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching insights:", error);
          setIsLoading(false);
          return;
        }

        if (scores && scores.length > 0) {
          // Group by category and calculate averages
          const categoryStats = new Map<string, { scores: number[]; reactions: number }>();
          
          scores.forEach((s) => {
            const category = s.entities?.category || "Other";
            if (!categoryStats.has(category)) {
              categoryStats.set(category, { scores: [], reactions: 0 });
            }
            const stats = categoryStats.get(category)!;
            stats.scores.push(s.score);
            stats.reactions += (s.positive_reactions || 0) + (s.negative_reactions || 0);
          });

          const generatedInsights: Insight[] = [];
          categoryStats.forEach((stats, category) => {
            if (stats.scores.length >= 2) {
              const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
              // Simulate change (would compare with previous period in production)
              const change = Math.round((Math.random() - 0.5) * 20);
              
              generatedInsights.push({
                id: category,
                text: `${category} sentiment`,
                change,
                direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
                category,
                confidence: stats.reactions > 50 ? "high" : stats.reactions > 20 ? "medium" : "low",
              });
            }
          });

          setInsights(generatedInsights.slice(0, 4));
          setTotalVotes(scores.reduce((acc, s) => acc + (s.positive_reactions || 0) + (s.negative_reactions || 0), 0));
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-score-green" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-score-red" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-score-green/20 text-score-green";
      case "medium":
        return "bg-score-yellow/20 text-score-yellow";
      default:
        return "bg-muted-foreground/20 text-muted-foreground";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-28 h-6" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </GlassCard>
    );
  }

  // Empty state
  if (insights.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-muted-foreground">Global Pulse</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>

          <h3 className="font-medium text-sm mb-1">Gathering global insights...</h3>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
            Patterns will emerge as more pulses are analyzed worldwide.
          </p>
        </motion.div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Global Pulse</h2>
      </div>

      {/* Insights */}
      <div className="space-y-3 mb-6">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
          >
            <div className="flex items-center gap-3">
              {getDirectionIcon(insight.direction)}
              <div>
                <p className="text-sm font-medium">{insight.text}</p>
                <span className="text-xs text-muted-foreground">{insight.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {insight.change !== 0 && (
                <span className={cn(
                  "text-sm font-bold",
                  insight.direction === "up" ? "text-score-green" : "text-score-red"
                )}>
                  {insight.change > 0 ? "+" : ""}{insight.change}%
                </span>
              )}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                getConfidenceColor(insight.confidence)
              )}>
                {insight.confidence}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mini Stats */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-xs text-muted-foreground mb-3">Patterns this week</p>
        <div className="grid grid-cols-2 gap-2">
          {timePatterns.map((pattern) => (
            <div
              key={pattern.label}
              className="p-3 rounded-lg bg-secondary/30 text-center"
            >
              <pattern.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{pattern.label}</p>
              <p className="text-sm font-medium">{pattern.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Note */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pulse Confidence:</span> Based on {totalVotes > 0 ? totalVotes.toLocaleString() : "gathering"} recent votes
        </p>
      </div>
    </GlassCard>
  );
};
