import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Clock, Users, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface VerifiedPulse {
  id: string;
  name: string;
  score: number;
  verifiedType: "event" | "location" | "time";
  participants: number;
  badge: string;
}

export const VerifiedPulses = () => {
  const navigate = useNavigate();
  const [verifiedPulses, setVerifiedPulses] = useState<VerifiedPulse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVerified = async () => {
      try {
        // Fetch verified entities
        const { data, error } = await supabase
          .from("entities")
          .select(`
            id,
            name,
            is_verified,
            entity_scores (score, positive_reactions)
          `)
          .eq("is_verified", true)
          .limit(5);

        if (error) {
          console.error("Error fetching verified:", error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const pulses: VerifiedPulse[] = data
            .filter((e) => e.entity_scores && e.entity_scores.length > 0)
            .map((entity) => ({
              id: entity.id,
              name: entity.name,
              score: entity.entity_scores[0]?.score || 0,
              verifiedType: "event" as const,
              participants: entity.entity_scores[0]?.positive_reactions || 0,
              badge: "Verified Entity",
            }));

          setVerifiedPulses(pulses);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerified();
  }, []);

  const getVerifiedIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Users className="w-3.5 h-3.5" />;
      case "location":
        return <MapPin className="w-3.5 h-3.5" />;
      case "time":
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5" />;
    }
  };

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-32 h-6" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  // Empty state
  if (verifiedPulses.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-muted-foreground">Confirmed Pulses</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-score-green/10 border border-score-green/20 flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <ShieldCheck className="w-7 h-7 text-score-green" />
          </motion.div>

          <h3 className="font-medium mb-2">Building trust, one verification at a time</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Verified pulses appear when entities confirm their identity. 
            High-trust content coming soon.
          </p>
        </motion.div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck className="w-5 h-5 text-score-green" />
        <h2 className="text-lg font-bold">Confirmed Pulses</h2>
      </div>

      <div className="space-y-3">
        {verifiedPulses.map((pulse, index) => (
          <motion.div
            key={pulse.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(pulse.name)}
            className="p-4 rounded-xl bg-score-green/5 border border-score-green/20 hover:bg-score-green/10 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{pulse.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="flex items-center gap-1 text-xs text-score-green bg-score-green/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    {pulse.badge}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <motion.span
                  className="text-2xl font-black text-score-green"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {pulse.score}
                </motion.span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {getVerifiedIcon(pulse.verifiedType)}
                <span className="capitalize">{pulse.verifiedType}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{pulse.participants.toLocaleString()} confirmed</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => navigate("/feed?view=verified")}
        className="w-full mt-4 py-3 text-sm text-score-green hover:text-score-green/80 flex items-center justify-center gap-2 transition-colors"
      >
        View all confirmed
        <ArrowRight className="w-4 h-4" />
      </button>
    </GlassCard>
  );
};

export default VerifiedPulses;
