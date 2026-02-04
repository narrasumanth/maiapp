import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  MessageSquare,
  Star,
  Newspaper,
  TrendingUp,
  Shield,
  Info,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface SourceData {
  icon: typeof Globe;
  name: string;
  weight: number;
  description: string;
  dataPoints: string[];
  impact: "positive" | "negative" | "neutral";
}

const sources: SourceData[] = [
  {
    icon: Globe,
    name: "Google Search",
    weight: 25,
    description: "Analysis of search results, featured snippets, and knowledge graph data",
    dataPoints: ["Search result sentiment", "Featured snippets", "Related searches", "Knowledge panel"],
    impact: "positive",
  },
  {
    icon: Star,
    name: "Review Sites",
    weight: 20,
    description: "Aggregated ratings from Yelp, TrustPilot, Google Reviews, and more",
    dataPoints: ["Average rating", "Review volume", "Response rate", "Recent trends"],
    impact: "positive",
  },
  {
    icon: MessageSquare,
    name: "Social Media",
    weight: 20,
    description: "Sentiment analysis from Twitter, Reddit, LinkedIn, and other platforms",
    dataPoints: ["Mention sentiment", "Engagement rate", "Follower trust", "Controversy flags"],
    impact: "neutral",
  },
  {
    icon: Newspaper,
    name: "News Articles",
    weight: 15,
    description: "Coverage from news outlets, press releases, and media mentions",
    dataPoints: ["Press sentiment", "Coverage volume", "Source credibility", "Recent headlines"],
    impact: "positive",
  },
  {
    icon: TrendingUp,
    name: "Sentiment Analysis",
    weight: 10,
    description: "AI-powered analysis of overall public perception and trends",
    dataPoints: ["Trend direction", "Sentiment score", "Emotion analysis", "Topic clusters"],
    impact: "neutral",
  },
  {
    icon: Shield,
    name: "Trust Signals",
    weight: 10,
    description: "Verification status, certifications, and authenticity markers",
    dataPoints: ["Verified profiles", "Certifications", "Domain authority", "Security indicators"],
    impact: "positive",
  },
];

const getImpactColor = (impact: SourceData["impact"]) => {
  switch (impact) {
    case "positive":
      return "text-score-green bg-score-green/10 border-score-green/30";
    case "negative":
      return "text-score-red bg-score-red/10 border-score-red/30";
    default:
      return "text-score-yellow bg-score-yellow/10 border-score-yellow/30";
  }
};

interface ScoreMethodologyProps {
  score: number;
}

export const ScoreMethodology = ({ score }: ScoreMethodologyProps) => {
  const [activeSource, setActiveSource] = useState<SourceData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <GlassCard className="p-5">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        How We Calculate
        <span className="ml-auto text-xs text-muted-foreground font-normal">
          Hover for details
        </span>
      </h4>

      {/* Interactive Chart */}
      <div className="space-y-2 mb-4">
        {sources.map((source, index) => (
          <motion.div
            key={source.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
              hoveredIndex === index
                ? "bg-primary/10 border border-primary/30"
                : "hover:bg-secondary/50"
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setActiveSource(source)}
          >
            <motion.div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                hoveredIndex === index ? "bg-primary/20" : "bg-secondary/50"
              }`}
              animate={{ scale: hoveredIndex === index ? 1.1 : 1 }}
            >
              <source.icon
                className={`w-4 h-4 ${
                  hoveredIndex === index ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium truncate transition-colors ${
                    hoveredIndex === index ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {source.name}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border ${getImpactColor(
                      source.impact
                    )}`}
                  >
                    {source.impact === "positive"
                      ? "+"
                      : source.impact === "negative"
                      ? "-"
                      : "~"}
                  </span>
                  <span className="text-xs font-bold text-primary">{source.weight}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-secondary/30 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-full ${
                    hoveredIndex === index
                      ? "bg-gradient-to-r from-primary to-accent"
                      : "bg-primary/50"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${source.weight * 4}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                />

                {/* Hover tooltip preview */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute -top-8 left-0 right-0 text-center"
                    >
                      <span className="text-[10px] bg-secondary/90 text-foreground px-2 py-1 rounded">
                        Click for details
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Info
              className={`w-4 h-4 shrink-0 transition-opacity ${
                hoveredIndex === index ? "opacity-100 text-primary" : "opacity-0"
              }`}
            />
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {activeSource && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-secondary/30 border border-white/10 mt-2">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <activeSource.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">{activeSource.name}</h5>
                    <span className="text-xs text-primary">{activeSource.weight}% weight</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSource(null)}
                  className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{activeSource.description}</p>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Data Points:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSource.dataPoints.map((point, i) => (
                    <motion.span
                      key={point}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground"
                    >
                      {point}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Impact on Score</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getImpactColor(activeSource.impact)}`}>
                    {activeSource.impact === "positive"
                      ? "Positive Contribution"
                      : activeSource.impact === "negative"
                      ? "Negative Factor"
                      : "Neutral Weight"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence Footer */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence Level</span>
          <span className="font-medium text-score-green">High (94%)</span>
        </div>
      </div>
    </GlassCard>
  );
};
