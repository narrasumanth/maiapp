import { motion } from "framer-motion";
import { Star, MessageSquare, Newspaper, TrendingUp, Shield, Award, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface Evidence {
  icon: "star" | "message" | "news" | "trending" | "shield" | "award";
  title: string;
  value: string;
  positive: boolean;
}

interface EvidenceSectionProps {
  evidence: Evidence[];
}

const iconMap = {
  star: Star,
  message: MessageSquare,
  news: Newspaper,
  trending: TrendingUp,
  shield: Shield,
  award: Award,
};

export const EvidenceSection = ({ evidence }: EvidenceSectionProps) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <GlassCard className="p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Key Proof
      </h3>

      <div className="space-y-3">
        {evidence.map((item, index) => {
          const Icon = iconMap[item.icon] || Star;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                item.positive ? "bg-score-green/20" : "bg-score-yellow/20"
              }`}>
                <Icon className={`w-5 h-5 ${
                  item.positive ? "text-score-green" : "text-score-yellow"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="font-medium truncate">{item.value}</p>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                item.positive ? "bg-score-green" : "bg-score-yellow"
              }`} />
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};
