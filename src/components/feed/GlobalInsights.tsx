import { motion } from "framer-motion";
import { BarChart3, TrendingDown, TrendingUp, Clock, Zap } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  text: string;
  change: number;
  direction: "up" | "down" | "neutral";
  category: string;
  confidence: "high" | "medium" | "low";
}

const insights: Insight[] = [
  { id: "1", text: "Food delivery sentiment", change: -6, direction: "down", category: "Services", confidence: "high" },
  { id: "2", text: "Concert pulses spike", change: 0, direction: "neutral", category: "Events", confidence: "medium" },
  { id: "3", text: "Movie premieres volatility", change: 24, direction: "up", category: "Entertainment", confidence: "high" },
  { id: "4", text: "Tech product trust", change: -3, direction: "down", category: "Products", confidence: "medium" },
];

const timePatterns = [
  { label: "Peak activity", value: "7-10 PM", icon: Clock },
  { label: "Most volatile", value: "Product launches", icon: Zap },
];

export const GlobalInsights = () => {
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
          <span className="font-medium text-foreground">Pulse Confidence:</span> Based on {(1200 + Math.floor(Math.random() * 500)).toLocaleString()} recent votes
        </p>
      </div>
    </GlassCard>
  );
};
