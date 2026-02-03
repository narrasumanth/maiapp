import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VelocityLockBanner } from "./VelocityLockBanner";
import { useToast } from "@/hooks/use-toast";

interface YayNayVotingProps {
  entityId: string;
  onAuthRequired: () => void;
  onVoteChange?: () => void;
}

export const YayNayVoting = ({ entityId, onAuthRequired, onVoteChange }: YayNayVotingProps) => {
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [yayCount, setYayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showBoostEffect, setShowBoostEffect] = useState(false);

  useEffect(() => {
    fetchVotes();
    checkUserVote();
    checkVelocityLock();
  }, [entityId]);

  const checkVelocityLock = async () => {
    const { data } = await supabase
      .from("entity_velocity_locks")
      .select("id")
      .eq("entity_id", entityId)
      .gt("unlocks_at", new Date().toISOString())
      .limit(1);

    setIsLocked(data && data.length > 0);
  };

  const fetchVotes = async () => {
    const { data } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId);

    if (data) {
      setYayCount(data.filter(r => r.is_positive).length);
    }
  };

  const checkUserVote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setHasVoted(true);
    }
  };

  const handleBoost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (isLocked) {
      toast({
        title: "Voting Paused",
        description: "This profile is in a cooling-off period.",
        variant: "destructive",
      });
      return;
    }

    if (hasVoted) {
      toast({
        title: "Already Boosted",
        description: "You've already boosted this profile!",
      });
      return;
    }

    setIsLoading(true);

    try {
      await supabase
        .from("entity_reviews")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          is_positive: true,
          points_staked: 0,
        });
      
      setHasVoted(true);
      setYayCount(c => c + 1);
      setShowBoostEffect(true);
      setTimeout(() => setShowBoostEffect(false), 1500);

      toast({
        title: "Score Boosted! 🚀",
        description: "Your support helps build their reputation.",
      });

      // Award points for participation
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 5,
        _action_type: "review",
        _reference_id: entityId,
      });

      onVoteChange?.();
    } catch (error) {
      console.error("Error boosting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Velocity Lock Warning */}
      <VelocityLockBanner entityId={entityId} />

      {/* Boost Effect Animation */}
      {showBoostEffect && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5] }}
          transition={{ duration: 1.5 }}
        >
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -50, opacity: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Boost Card */}
      <div className="glass-card p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Boost Their Score</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Your thumbs up directly increases their MAI score
        </p>

        <motion.button
          onClick={handleBoost}
          disabled={isLoading || isLocked || hasVoted}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-medium transition-all ${
            hasVoted
              ? "bg-score-green/20 text-score-green border border-score-green/30"
              : isLocked
              ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-score-green to-emerald-500 text-white hover:shadow-lg hover:shadow-score-green/25"
          }`}
          whileHover={!hasVoted && !isLocked ? { scale: 1.02 } : {}}
          whileTap={!hasVoted && !isLocked ? { scale: 0.98 } : {}}
        >
          <ThumbsUp className={`w-6 h-6 ${hasVoted ? "fill-current" : ""}`} />
          <span className="text-lg">
            {hasVoted ? "You Boosted!" : "Give Thumbs Up"}
          </span>
        </motion.button>

        {/* Boost Count */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ThumbsUp className="w-4 h-4 text-score-green" />
          <span>{yayCount.toLocaleString()} people boosted this profile</span>
        </div>
      </div>
    </div>
  );
};
