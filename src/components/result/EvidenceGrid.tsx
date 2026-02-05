import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Newspaper, TrendingUp, Shield, Award, CheckCircle, AlertCircle, Lock, Sparkles, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Evidence {
  icon: "star" | "message" | "news" | "trending" | "shield" | "award";
  title: string;
  value: string;
  positive: boolean;
}

interface EvidenceGridProps {
  evidence: Evidence[];
  onAuthRequired?: () => void;
}

const iconMap = {
  star: Star,
  message: MessageSquare,
  news: Newspaper,
  trending: TrendingUp,
  shield: Shield,
  award: Award,
};

export const EvidenceGrid = ({ evidence, onAuthRequired }: EvidenceGridProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const VISIBLE_COUNT = 2;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!evidence || evidence.length === 0) return null;

  const visibleEvidence = evidence.slice(0, VISIBLE_COUNT);
  const blurredEvidence = evidence.slice(VISIBLE_COUNT);
  const hasBlurred = !isLoggedIn && blurredEvidence.length > 0;

  const renderEvidenceCard = (item: Evidence, index: number, isBlurred: boolean = false) => {
    const Icon = iconMap[item.icon] || Star;
    return (
      <motion.div
        key={`evidence-${index}-${isBlurred}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`relative p-4 rounded-xl border transition-all ${
          isBlurred ? "" : "hover:scale-[1.02]"
        } ${
          item.positive 
            ? "bg-score-green/5 border-score-green/20 hover:border-score-green/40" 
            : "bg-score-yellow/5 border-score-yellow/20 hover:border-score-yellow/40"
        } ${isBlurred ? "select-none" : ""}`}
      >
        {isBlurred && (
          <div className="absolute inset-0 backdrop-blur-md bg-background/40 rounded-xl z-10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground/50" />
          </div>
        )}
        <div className={`absolute top-3 right-3 ${item.positive ? "text-score-green" : "text-score-yellow"} ${isBlurred ? "blur-sm" : ""}`}>
          {item.positive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>
        <div className={`flex items-start gap-3 ${isBlurred ? "blur-sm" : ""}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            item.positive ? "bg-score-green/20" : "bg-score-yellow/20"
          }`}>
            <Icon className={`w-5 h-5 ${item.positive ? "text-score-green" : "text-score-yellow"}`} />
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.title}</p>
            <p className="font-medium text-sm leading-snug">{item.value}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Key Proof
        {hasBlurred && (
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {VISIBLE_COUNT} of {evidence.length} shown
          </span>
        )}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleEvidence.map((item, index) => renderEvidenceCard(item, index, false))}
        {hasBlurred && blurredEvidence.map((item, index) => renderEvidenceCard(item, VISIBLE_COUNT + index, true))}
        {isLoggedIn && blurredEvidence.map((item, index) => renderEvidenceCard(item, VISIBLE_COUNT + index, false))}
      </div>

      {hasBlurred && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Unlock {blurredEvidence.length} more proof{blurredEvidence.length > 1 ? "s" : ""}</p>
              <p className="text-xs text-muted-foreground">Sign up free to see the complete trust analysis</p>
            </div>
            <button
              onClick={onAuthRequired}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
