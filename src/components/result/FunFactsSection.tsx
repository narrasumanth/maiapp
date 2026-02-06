import { motion } from "framer-motion";
import { Sparkles, BookOpen, AlertCircle } from "lucide-react";

interface FunFactsSectionProps {
  funFact?: string;
  hardFact?: string;
}

export const FunFactsSection = ({ funFact, hardFact }: FunFactsSectionProps) => {
  if (!funFact && !hardFact) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        <AlertCircle className="w-3 h-3" />
        <span className="italic">For entertainment only — take with a grain of salt! 🧂</span>
      </div>

      {funFact && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-primary">Fun Fact</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">😂 LOL</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {funFact}
            </p>
          </div>
        </motion.div>
      )}

      {hardFact && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary/30 to-muted/30 border border-secondary/30"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/50 to-muted/50 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-foreground">Hard Fact</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">🎯 Real Talk</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {hardFact}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
