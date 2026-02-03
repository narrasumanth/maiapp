import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface YayNayVotingProps {
  entityId: string;
  onAuthRequired: () => void;
  onVoteChange?: () => void;
}

export const YayNayVoting = ({ entityId, onAuthRequired, onVoteChange }: YayNayVotingProps) => {
  const { toast } = useToast();
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [yayCount, setYayCount] = useState(0);
  const [nayCount, setNayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showBoostEffect, setShowBoostEffect] = useState(false);

  useEffect(() => {
    fetchVotes();
    checkUserVote();
  }, [entityId]);

  const fetchVotes = async () => {
    const { data } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId);

    if (data) {
      setYayCount(data.filter(r => r.is_positive).length);
      setNayCount(data.filter(r => !r.is_positive).length);
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
      setUserVote(data.is_positive);
    }
  };

  const handleVote = async (isPositive: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (userVote !== null) {
      toast({
        title: "Already Voted",
        description: "You've already rated this profile!",
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
          is_positive: isPositive,
          points_staked: 0,
        });
      
      setUserVote(isPositive);
      if (isPositive) {
        setYayCount(c => c + 1);
        setShowBoostEffect(true);
        setTimeout(() => setShowBoostEffect(false), 1500);
        toast({
          title: "Score Boosted! 🚀",
          description: "Your support helps build their reputation.",
        });
      } else {
        setNayCount(c => c + 1);
        toast({
          title: "Feedback Recorded",
          description: "Your input helps improve trust scores.",
        });
      }

      // Award points for participation
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: isPositive ? 5 : 2,
        _action_type: "review",
        _reference_id: entityId,
      });

      onVoteChange?.();
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
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

      {/* Voting Card */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-center mb-4">Rate This Profile</h3>

        <div className="flex items-center justify-center gap-6">
          {/* Thumbs Up */}
          <motion.button
            onClick={() => handleVote(true)}
            disabled={isLoading || userVote !== null}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              userVote === true
                ? "bg-score-green/20 text-score-green border border-score-green/30"
                : userVote !== null
                ? "opacity-40 cursor-not-allowed"
                : "bg-secondary/30 hover:bg-score-green/20 hover:text-score-green"
            }`}
            whileHover={userVote === null ? { scale: 1.05 } : {}}
            whileTap={userVote === null ? { scale: 0.95 } : {}}
          >
            <ThumbsUp className={`w-8 h-8 ${userVote === true ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{yayCount}</span>
          </motion.button>

          {/* Divider */}
          <div className="h-16 w-px bg-white/10" />

          {/* Thumbs Down */}
          <motion.button
            onClick={() => handleVote(false)}
            disabled={isLoading || userVote !== null}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              userVote === false
                ? "bg-score-red/20 text-score-red border border-score-red/30"
                : userVote !== null
                ? "opacity-40 cursor-not-allowed"
                : "bg-secondary/30 hover:bg-score-red/20 hover:text-score-red"
            }`}
            whileHover={userVote === null ? { scale: 1.05 } : {}}
            whileTap={userVote === null ? { scale: 0.95 } : {}}
          >
            <ThumbsDown className={`w-8 h-8 ${userVote === false ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{nayCount}</span>
          </motion.button>
        </div>

        {userVote !== null && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Thanks for your feedback!
          </p>
        )}
      </div>
    </div>
  );
};