import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BoostProfileProps {
  entityId: string;
  onAuthRequired: () => void;
  onBoostChange?: () => void;
}

export const BoostProfile = ({ entityId, onAuthRequired, onBoostChange }: BoostProfileProps) => {
  const { toast } = useToast();
  const [hasTrusted, setHasTrusted] = useState<boolean | null>(null);
  const [hasVoted, setHasVoted] = useState<"up" | "down" | null>(null);
  const [trustCount, setTrustCount] = useState(0);
  const [thumbsUpCount, setThumbsUpCount] = useState(0);
  const [thumbsDownCount, setThumbsDownCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    fetchCounts();
    checkUserActions();
  }, [entityId]);

  const fetchCounts = async () => {
    // Count trust verifications (boosts with no content)
    const { data: trustData } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId)
      .eq("is_positive", true)
      .is("content", null);

    if (trustData) {
      setTrustCount(trustData.length);
    }

    // Count reactions (thumbs up/down)
    const { data: reactions } = await supabase
      .from("entity_reactions")
      .select("reaction_type")
      .eq("entity_id", entityId);

    if (reactions) {
      setThumbsUpCount(reactions.filter(r => r.reaction_type === "thumbs_up").length);
      setThumbsDownCount(reactions.filter(r => r.reaction_type === "thumbs_down").length);
    }
  };

  const checkUserActions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has trusted
    const { data: trustData } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .is("content", null)
      .single();

    if (trustData) {
      setHasTrusted(true);
    }

    // Check if user has voted
    const { data: voteData } = await supabase
      .from("entity_reactions")
      .select("reaction_type")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .single();

    if (voteData) {
      setHasVoted(voteData.reaction_type === "thumbs_up" ? "up" : "down");
    }
  };

  const handleTrust = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (hasTrusted) {
      toast({
        title: "Already Trusted",
        description: "You've already trusted this profile!",
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
          content: null,
        });
      
      setHasTrusted(true);
      setTrustCount(c => c + 1);
      setShowEffect(true);
      setTimeout(() => setShowEffect(false), 1500);
      
      toast({
        title: "Profile Trusted! ✨",
        description: "You confirmed this is a genuine profile.",
      });

      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 3,
        _action_type: "boost",
        _reference_id: entityId,
      });

      onBoostChange?.();
    } catch (error) {
      console.error("Error trusting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (type: "up" | "down") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You've already shared your opinion!",
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
          reaction_type: type === "up" ? "thumbs_up" : "thumbs_down",
        });
      
      setHasVoted(type);
      if (type === "up") {
        setThumbsUpCount(c => c + 1);
      } else {
        setThumbsDownCount(c => c + 1);
      }
      
      toast({
        title: type === "up" ? "👍 Positive Vote!" : "👎 Negative Vote",
        description: "Thanks for sharing your opinion.",
      });

      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 2,
        _action_type: "vote",
        _reference_id: entityId,
      });

      onBoostChange?.();
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Effect Animation */}
      {showEffect && (
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

      <div className="grid md:grid-cols-2 gap-4">
        {/* Trust Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              I Trust This Profile
            </h3>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
              {trustCount} trusted
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Confirm this is a genuine, legitimate profile.
          </p>

          <motion.button
            onClick={handleTrust}
            disabled={isLoading || hasTrusted === true}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              hasTrusted
                ? "bg-score-green/20 text-score-green border border-score-green/30 cursor-default"
                : "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
            }`}
            whileHover={!hasTrusted ? { scale: 1.02 } : {}}
            whileTap={!hasTrusted ? { scale: 0.98 } : {}}
          >
            <ShieldCheck className="w-5 h-5" />
            {hasTrusted ? "You Trust This" : "Trust This Profile"}
          </motion.button>
        </div>

        {/* Thumbs Up/Down Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">How Do You Feel?</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> {thumbsUpCount}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" /> {thumbsDownCount}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Share your opinion about this profile.
          </p>

          <div className="flex gap-3">
            <motion.button
              onClick={() => handleVote("up")}
              disabled={isLoading || hasVoted !== null}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                hasVoted === "up"
                  ? "bg-score-green/20 text-score-green border border-score-green/30"
                  : hasVoted === "down"
                  ? "bg-secondary/30 text-muted-foreground border border-border opacity-50"
                  : "bg-score-green/10 text-score-green hover:bg-score-green/20 border border-score-green/20"
              }`}
              whileHover={hasVoted === null ? { scale: 1.02 } : {}}
              whileTap={hasVoted === null ? { scale: 0.98 } : {}}
            >
              <ThumbsUp className="w-5 h-5" />
              {hasVoted === "up" ? "Voted" : "Good"}
            </motion.button>

            <motion.button
              onClick={() => handleVote("down")}
              disabled={isLoading || hasVoted !== null}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                hasVoted === "down"
                  ? "bg-score-red/20 text-score-red border border-score-red/30"
                  : hasVoted === "up"
                  ? "bg-secondary/30 text-muted-foreground border border-border opacity-50"
                  : "bg-score-red/10 text-score-red hover:bg-score-red/20 border border-score-red/20"
              }`}
              whileHover={hasVoted === null ? { scale: 1.02 } : {}}
              whileTap={hasVoted === null ? { scale: 0.98 } : {}}
            >
              <ThumbsDown className="w-5 h-5" />
              {hasVoted === "down" ? "Voted" : "Bad"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
