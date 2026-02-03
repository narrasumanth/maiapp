import { motion } from "framer-motion";
import { 
  Globe, 
  MessageSquare, 
  Star, 
  Newspaper, 
  TrendingUp,
  Shield,
  ChevronRight
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const sources = [
  { icon: Globe, name: "Google Search", weight: 25 },
  { icon: Star, name: "Review Sites", weight: 20 },
  { icon: MessageSquare, name: "Social Media", weight: 20 },
  { icon: Newspaper, name: "News Articles", weight: 15 },
  { icon: TrendingUp, name: "Sentiment Analysis", weight: 10 },
  { icon: Shield, name: "Trust Signals", weight: 10 },
];

interface ScoreMethodologyProps {
  score: number;
}

export const ScoreMethodology = ({ score }: ScoreMethodologyProps) => {
  return (
    <GlassCard className="p-5">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        How We Calculate
      </h4>
      
      <div className="space-y-2">
        {sources.map((source, index) => (
          <motion.div
            key={source.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center">
              <source.icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground truncate">{source.name}</span>
                <span className="text-xs font-medium text-primary">{source.weight}%</span>
              </div>
              <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${source.weight * 4}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence Level</span>
          <span className="font-medium text-score-green">High (94%)</span>
        </div>
      </div>
    </GlassCard>
  );
};
