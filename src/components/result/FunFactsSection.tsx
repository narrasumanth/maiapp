import { motion } from "framer-motion";
import { Sparkles, BookOpen } from "lucide-react";

interface FunFactsSectionProps {
  funFact?: string;
  hardFact?: string;
}

export const FunFactsSection = ({ funFact, hardFact }: FunFactsSectionProps) => {
  if (!funFact && !hardFact) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {funFact && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Fun Fact</h4>
              <span className="text-xs text-primary">😂 For Laughs</span>
            </div>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {funFact}
          </p>
        </motion.div>
      )}

      {hardFact && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Hard Fact</h4>
              <span className="text-xs text-muted-foreground">🎯 Real Talk</span>
            </div>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {hardFact}
          </p>
        </motion.div>
      )}
    </div>
  );
};
