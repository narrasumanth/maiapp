import { motion } from "framer-motion";
import { Star, MessageSquare, Newspaper, TrendingUp, Shield, Award } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface Evidence {
  icon: "star" | "message" | "news" | "trending" | "shield" | "award";
  title: string;
  value: string;
  positive: boolean;
}

interface EvidenceCardProps {
  evidence: Evidence;
  index?: number;
}

const iconMap = {
  star: Star,
  message: MessageSquare,
  news: Newspaper,
  trending: TrendingUp,
  shield: Shield,
  award: Award,
};

export const EvidenceCard = ({ evidence, index = 0 }: EvidenceCardProps) => {
  const Icon = iconMap[evidence.icon];

  return (
    <GlassCard
      variant="hover"
      className="p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          evidence.positive ? "bg-score-green/20" : "bg-score-yellow/20"
        }`}>
          <Icon className={`w-5 h-5 ${
            evidence.positive ? "text-score-green" : "text-score-yellow"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{evidence.title}</p>
          <p className="font-semibold text-foreground truncate">{evidence.value}</p>
        </div>
      </div>
    </GlassCard>
  );
};
