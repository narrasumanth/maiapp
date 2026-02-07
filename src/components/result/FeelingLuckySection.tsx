import { motion } from "framer-motion";
import { Sparkles, Trophy, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const FeelingLuckySection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="my-6 sm:my-10"
    >
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/30 to-primary/5 border border-primary/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Feeling Lucky?</span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
              Join MAI Madness & Boost Your Profile
            </h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Winners earn points to <span className="text-foreground font-medium">boost their profile visibility</span>. 
              Join with just your email — no account needed. We'll notify winners instantly!
            </p>
            
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-score-yellow" />
                Win Points
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Boost Profile
              </span>
            </div>
          </div>
          
          <Link to="/impulse" className="shrink-0">
            <Button 
              size="lg" 
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
            >
              <Sparkles className="w-4 h-4" />
              Try MAI Madness
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
};
