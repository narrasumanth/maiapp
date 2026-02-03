import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";

interface YayNayVotingProps {
  entityId: string;
  onAuthRequired: () => void;
  onVoteChange?: () => void;
}

export const YayNayVoting = ({ entityId, onAuthRequired, onVoteChange }: YayNayVotingProps) => {
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [yayCount, setYayCount] = useState(0);
  const [nayCount, setNayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

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
      setHasVoted(true);
    }
  };

  const handleVote = async (isPositive: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    setIsLoading(true);

    try {
      if (hasVoted) {
        if (userVote === isPositive) {
          // Remove vote
          await supabase
            .from("entity_reviews")
            .delete()
            .eq("entity_id", entityId)
            .eq("user_id", user.id);
          
          setUserVote(null);
          setHasVoted(false);
          if (isPositive) setYayCount(c => c - 1);
          else setNayCount(c => c - 1);
        } else {
          // Change vote
          await supabase
            .from("entity_reviews")
            .update({ is_positive: isPositive })
            .eq("entity_id", entityId)
            .eq("user_id", user.id);
          
          setUserVote(isPositive);
          if (isPositive) {
            setYayCount(c => c + 1);
            setNayCount(c => c - 1);
          } else {
            setYayCount(c => c - 1);
            setNayCount(c => c + 1);
          }
        }
      } else {
        // New vote - users can vote multiple times
        await supabase
          .from("entity_reviews")
          .insert({
            entity_id: entityId,
            user_id: user.id,
            is_positive: isPositive,
          });
        
        setUserVote(isPositive);
        setHasVoted(true);
        if (isPositive) setYayCount(c => c + 1);
        else setNayCount(c => c + 1);

        // Award points for voting
        await supabase.rpc("award_points", {
          _user_id: user.id,
          _amount: 5,
          _action_type: "review",
          _reference_id: entityId,
        });
      }

      onVoteChange?.();
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const total = yayCount + nayCount;
  const yayPercent = total > 0 ? Math.round((yayCount / total) * 100) : 50;
  const nayPercent = total > 0 ? 100 - yayPercent : 50;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Community Verdict
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 rounded-full bg-secondary/50 overflow-hidden mb-6">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-score-green to-emerald-400"
          initial={{ width: "50%" }}
          animate={{ width: `${yayPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Vote Buttons - Clean, no counts */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => handleVote(true)}
          disabled={isLoading}
          className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
            userVote === true
              ? "bg-score-green/20 border-score-green text-score-green"
              : "bg-secondary/30 border-white/10 hover:border-score-green/50 hover:bg-score-green/10"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ThumbsUp className={`w-10 h-10 ${userVote === true ? "fill-current" : ""}`} />
          <span className="text-xl font-bold">Yay</span>
          {userVote === true && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-score-green"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
          )}
        </motion.button>

        <motion.button
          onClick={() => handleVote(false)}
          disabled={isLoading}
          className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
            userVote === false
              ? "bg-score-red/20 border-score-red text-score-red"
              : "bg-secondary/30 border-white/10 hover:border-score-red/50 hover:bg-score-red/10"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ThumbsDown className={`w-10 h-10 ${userVote === false ? "fill-current" : ""}`} />
          <span className="text-xl font-bold">Nay</span>
          {userVote === false && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-score-red"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
          )}
        </motion.button>
      </div>

      {!hasVoted && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Cast your vote to help the community!
        </p>
      )}
    </GlassCard>
  );
};
