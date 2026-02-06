import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrustVerificationProps {
  entityId: string;
  onAuthRequired: () => void;
  onTrustChange?: () => void;
}

export const TrustVerification = ({ entityId, onAuthRequired, onTrustChange }: TrustVerificationProps) => {
  const { toast } = useToast();
  const [hasTrusted, setHasTrusted] = useState<boolean | null>(null);
  const [trustCount, setTrustCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    fetchCounts();
    checkUserActions();
  }, [entityId]);

  const fetchCounts = async () => {
    const { data: trustData } = await supabase
      .from("entity_reviews")
      .select("is_positive")
      .eq("entity_id", entityId)
      .eq("is_positive", true)
      .is("content", null);

    if (trustData) {
      setTrustCount(trustData.length);
    }
  };

  const checkUserActions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
  };

  const handleTrust = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (hasTrusted) {
      toast({
        title: "Already Verified",
        description: "You've already verified this profile!",
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
        title: "Profile Verified! ✨",
        description: "You confirmed this is a genuine profile.",
      });

      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 3,
        _action_type: "boost",
        _reference_id: entityId,
      });

      onTrustChange?.();
    } catch (error) {
      console.error("Error trusting:", error);
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
        {hasTrusted ? `Verified by You (${trustCount} total)` : `Verify This Profile (${trustCount})`}
      </motion.button>
    </div>
  );
};
