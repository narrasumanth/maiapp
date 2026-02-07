import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, TrendingUp, Eye, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DailyWinnerData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  trust_score: number;
  entity_name?: string;
  entity_id?: string;
}

export const DailyWinner = () => {
  const navigate = useNavigate();
  const [winner, setWinner] = useState<DailyWinnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDailyWinner();
  }, []);

  const fetchDailyWinner = async () => {
    // Get today's winner from hourly_draws
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: draw } = await supabase
      .from("hourly_draws")
      .select("winner_id, prize_amount")
      .gte("draw_time", today.toISOString())
      .order("prize_amount", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid 406 error when no rows

    if (draw?.winner_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, trust_score")
        .eq("user_id", draw.winner_id)
        .maybeSingle();

      if (profile) {
        // Check if they have a claimed entity
        const { data: entity } = await supabase
          .from("entities")
          .select("id, name")
          .eq("claimed_by", profile.user_id)
          .limit(1)
          .maybeSingle();

        setWinner({
          id: profile.user_id,
          display_name: profile.display_name || "Anonymous Champion",
          avatar_url: profile.avatar_url,
          trust_score: profile.trust_score || 50,
          entity_name: entity?.name,
          entity_id: entity?.id,
        });
      }
    }
    
    setIsLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 86) return "text-score-diamond";
    if (score >= 61) return "text-score-green";
    if (score >= 40) return "text-primary";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-secondary/20 border border-white/5 p-6 animate-pulse">
        <div className="h-20 bg-secondary/30 rounded-xl" />
      </div>
    );
  }

  // Show placeholder if no winner yet today
  if (!winner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/20 to-primary/10 border border-primary/20 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Daily Champion</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">Today's Winner Awaits</h3>
            <p className="text-sm text-muted-foreground">
              Win the next draw to be featured here and gain maximum visibility!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Featured Slot</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/20 to-primary/10 border border-primary/20 p-6 relative overflow-hidden"
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16 border-2 border-primary/40">
            <AvatarImage src={winner.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {winner.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">🏆 Today's Champion</span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{winner.display_name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-sm font-semibold ${getScoreColor(winner.trust_score)}`}>
              Pulse: {winner.trust_score}
            </span>
            {winner.entity_name && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{winner.entity_name}</span>
              </>
            )}
          </div>
        </div>
        
        {winner.entity_id && (
          <button
            onClick={() => navigate(`/result?q=${encodeURIComponent(winner.entity_name || "")}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">View Profile</span>
            <ExternalLink className="w-3 h-3 text-primary" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
