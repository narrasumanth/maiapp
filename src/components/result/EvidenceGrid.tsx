import { motion } from "framer-motion";
import { Star, MessageSquare, Newspaper, TrendingUp, Shield, Award, CheckCircle, AlertCircle } from "lucide-react";

interface Evidence {
  icon: "star" | "message" | "news" | "trending" | "shield" | "award";
  title: string;
  value: string;
  positive: boolean;
}

interface EvidenceGridProps {
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

export const EvidenceGrid = ({ evidence }: EvidenceGridProps) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Key Evidence
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {evidence.map((item, index) => {
          const Icon = iconMap[item.icon] || Star;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                item.positive 
                  ? "bg-score-green/5 border-score-green/20 hover:border-score-green/40" 
                  : "bg-score-yellow/5 border-score-yellow/20 hover:border-score-yellow/40"
              }`}
            >
              {/* Status indicator */}
              <div className={`absolute top-3 right-3 ${item.positive ? "text-score-green" : "text-score-yellow"}`}>
                {item.positive ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  item.positive ? "bg-score-green/20" : "bg-score-yellow/20"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    item.positive ? "text-score-green" : "text-score-yellow"
                  }`} />
                </div>
                <div className="flex-1 min-w-0 pr-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.title}</p>
                  <p className="font-medium text-sm leading-snug">{item.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
