import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BoostProfileProps {
  entityId: string;
  onAuthRequired: () => void;
  onBoostChange?: () => void;
}

export const BoostProfile = ({ entityId, onAuthRequired, onBoostChange }: BoostProfileProps) => {
  const { toast } = useToast();
  const [hasBoosted, setHasBoosted] = useState<boolean | null>(null);
  const [boostCount, setBoostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showBoostEffect, setShowBoostEffect] = useState(false);

  useEffect(() => {
    fetchBoosts();
    checkUserBoost();
  }, [entityId]);

  const fetchBoosts = async () => {
    // Count only positive votes as "boosts" (genuine confirmations)
    const { data } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId)
      .eq("is_positive", true)
      .is("content", null); // Boosts have no content, reviews do

    if (data) {
      setBoostCount(data.length);
    }
  };

  const checkUserBoost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .is("content", null) // Boost, not review
      .single();

    if (data) {
      setHasBoosted(data.is_positive);
    }
  };

  const handleBoost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (hasBoosted !== null) {
      toast({
        title: "Already Verified",
        description: "You've already confirmed this profile!",
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
          content: null, // null content = boost, not review
        });
      
      setHasBoosted(true);
      setBoostCount(c => c + 1);
      setShowBoostEffect(true);
      setTimeout(() => setShowBoostEffect(false), 1500);
      
      toast({
        title: "Profile Boosted! ✨",
        description: "You confirmed this is a genuine profile.",
      });

      // Award points for boosting
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 3,
        _action_type: "boost",
        _reference_id: entityId,
      });

      onBoostChange?.();
    } catch (error) {
      console.error("Error boosting:", error);
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

      {/* Boost Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Is This Profile Genuine?
          </h3>
          <span className="text-sm text-muted-foreground">
            {boostCount} {boostCount === 1 ? "verification" : "verifications"}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Help the community by confirming if this is a real, legitimate profile.
        </p>

        <motion.button
          onClick={handleBoost}
          disabled={isLoading || hasBoosted !== null}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            hasBoosted === true
              ? "bg-score-green/20 text-score-green border border-score-green/30 cursor-default"
              : hasBoosted === false
              ? "bg-score-red/20 text-score-red border border-score-red/30 cursor-default"
              : "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
          }`}
          whileHover={hasBoosted === null ? { scale: 1.02 } : {}}
          whileTap={hasBoosted === null ? { scale: 0.98 } : {}}
        >
          {hasBoosted === true ? (
            <>
              <ShieldCheck className="w-5 h-5" />
              You Verified This Profile
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Boost This Profile
            </>
          )}
        </motion.button>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Boosting confirms this is a genuine profile and increases its trust score.
        </p>
      </div>
    </div>
  );
};
