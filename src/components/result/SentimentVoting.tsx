import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Minus, Sparkles, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SentimentVotingProps {
  entityId: string;
  onAuthRequired: () => void;
  onVoteChange?: () => void;
}

type SentimentType = "good" | "neutral" | "concerned" | null;

export const SentimentVoting = ({ entityId, onAuthRequired, onVoteChange }: SentimentVotingProps) => {
  const { toast } = useToast();
  const [userVote, setUserVote] = useState<SentimentType>(null);
  const [goodCount, setGoodCount] = useState(0);
  const [neutralCount, setNeutralCount] = useState(0);
  const [concernedCount, setConcernedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showBoostEffect, setShowBoostEffect] = useState(false);

  useEffect(() => {
    fetchVotes();
    checkUserVote();
  }, [entityId]);

  const fetchVotes = async () => {
    const { data } = await supabase
      .from("entity_reactions")
      .select("reaction_type")
      .eq("entity_id", entityId);

    if (data) {
      setGoodCount(data.filter(r => r.reaction_type === "good").length);
      setNeutralCount(data.filter(r => r.reaction_type === "neutral").length);
      setConcernedCount(data.filter(r => r.reaction_type === "concerned").length);
    }
  };

  const checkUserVote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("entity_reactions")
      .select("reaction_type")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserVote(data.reaction_type as SentimentType);
    }
  };

  const handleVote = async (sentiment: SentimentType) => {
    if (!sentiment) return;
    
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
        .from("entity_reactions")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          reaction_type: sentiment,
        });
      
      setUserVote(sentiment);
      
      if (sentiment === "good") {
        setGoodCount(c => c + 1);
        setShowBoostEffect(true);
        setTimeout(() => setShowBoostEffect(false), 1500);
        toast({
          title: "Positive Vote! 👍",
          description: "Your support helps build their reputation.",
        });
      } else if (sentiment === "neutral") {
        setNeutralCount(c => c + 1);
        toast({
          title: "Neutral Recorded",
          description: "Thanks for your honest feedback.",
        });
      } else {
        setConcernedCount(c => c + 1);
        toast({
          title: "Concern Noted",
          description: "Your input helps improve trust scores.",
        });
      }

      // Award points for participation
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: sentiment === "good" ? 5 : 2,
        _action_type: "vote",
        _reference_id: entityId,
      });

      onVoteChange?.();
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalVotes = goodCount + neutralCount + concernedCount;
  
  const getPercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  const goodPercent = getPercentage(goodCount);
  const neutralPercent = getPercentage(neutralCount);
  const concernedPercent = getPercentage(concernedCount);

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
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">How Do You Feel?</h3>
          {totalVotes > 0 && (
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
              {totalVotes} votes
            </span>
          )}
        </div>
        
        {/* Impact messaging */}
        <p className="text-xs text-primary/80 mb-4 flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          <span>Your vote directly impacts the live Pulse score</span>
        </p>

        <div className="flex items-center justify-center gap-4">
          {/* Good */}
          <motion.button
            onClick={() => handleVote("good")}
            disabled={isLoading || userVote !== null}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all flex-1 ${
              userVote === "good"
                ? "bg-score-green/20 text-score-green border border-score-green/30"
                : userVote !== null
                ? "opacity-40 cursor-not-allowed"
                : "bg-secondary/30 hover:bg-score-green/20 hover:text-score-green"
            }`}
            whileHover={userVote === null ? { scale: 1.03 } : {}}
            whileTap={userVote === null ? { scale: 0.97 } : {}}
          >
            <ThumbsUp className={`w-7 h-7 ${userVote === "good" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Good</span>
            <span className="text-sm font-semibold">
              {totalVotes > 0 ? `${goodPercent}%` : "—"}
            </span>
          </motion.button>

          {/* Neutral */}
          <motion.button
            onClick={() => handleVote("neutral")}
            disabled={isLoading || userVote !== null}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all flex-1 ${
              userVote === "neutral"
                ? "bg-score-yellow/20 text-score-yellow border border-score-yellow/30"
                : userVote !== null
                ? "opacity-40 cursor-not-allowed"
                : "bg-secondary/30 hover:bg-score-yellow/20 hover:text-score-yellow"
            }`}
            whileHover={userVote === null ? { scale: 1.03 } : {}}
            whileTap={userVote === null ? { scale: 0.97 } : {}}
          >
            <Minus className={`w-7 h-7 ${userVote === "neutral" ? "stroke-[3]" : ""}`} />
            <span className="text-xs font-medium">Neutral</span>
            <span className="text-sm font-semibold">
              {totalVotes > 0 ? `${neutralPercent}%` : "—"}
            </span>
          </motion.button>

          {/* Concerned */}
          <motion.button
            onClick={() => handleVote("concerned")}
            disabled={isLoading || userVote !== null}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all flex-1 ${
              userVote === "concerned"
                ? "bg-score-red/20 text-score-red border border-score-red/30"
                : userVote !== null
                ? "opacity-40 cursor-not-allowed"
                : "bg-secondary/30 hover:bg-score-red/20 hover:text-score-red"
            }`}
            whileHover={userVote === null ? { scale: 1.03 } : {}}
            whileTap={userVote === null ? { scale: 0.97 } : {}}
          >
            <ThumbsDown className={`w-7 h-7 ${userVote === "concerned" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Concerned</span>
            <span className="text-sm font-semibold">
              {totalVotes > 0 ? `${concernedPercent}%` : "—"}
            </span>
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
