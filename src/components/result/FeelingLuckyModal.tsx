import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Zap, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FeelingLuckyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeelingLuckyModal = ({ isOpen, onClose }: FeelingLuckyModalProps) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md"
          >
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              {/* Background decoration */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              
              <div className="relative z-10 text-center">
                {/* Icon */}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4"
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Feeling Lucky? 🎰
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Join <span className="text-primary font-semibold">MAI Madness</span> and win points to boost your profile visibility!
                </p>
                
                {/* Benefits */}
                <div className="flex items-center justify-center gap-4 mb-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
                    <Trophy className="w-3.5 h-3.5 text-score-yellow" />
                    Win Points
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Boost Profile
                  </span>
                </div>
                
                {/* CTA */}
                <Link to="/impulse" onClick={onClose}>
                  <Button 
                    size="lg" 
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                  >
                    <Sparkles className="w-4 h-4" />
                    Try MAI Madness
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                
                <p className="text-xs text-muted-foreground mt-4">
                  No account needed • Just enter your email to play
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
