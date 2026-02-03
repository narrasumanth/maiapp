import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { format, formatDistanceToNow } from "date-fns";

interface ScoreHistoryEntry {
  id: string;
  score: number;
  change_amount: number | null;
  change_reason: string | null;
  recorded_at: string;
}

interface ScoreHistoryTimelineProps {
  entityId: string;
}

export const ScoreHistoryTimeline = ({ entityId }: ScoreHistoryTimelineProps) => {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`score-history-${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "entity_score_history",
          filter: `entity_id=eq.${entityId}`,
        },
        (payload) => {
          setHistory(prev => [payload.new as ScoreHistoryEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("entity_score_history")
      .select("*")
      .eq("entity_id", entityId)
      .order("recorded_at", { ascending: false })
      .limit(20);

    if (data) {
      setHistory(data);
    }
    setIsLoading(false);
  };

  const getChangeIcon = (change: number | null) => {
    if (!change || change === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-score-green" />;
    return <TrendingDown className="w-4 h-4 text-score-red" />;
  };

  const getChangeColor = (change: number | null) => {
    if (!change || change === 0) return "text-muted-foreground";
    if (change > 0) return "text-score-green";
    return "text-score-red";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-score-diamond/20 text-score-diamond border-score-diamond/30";
    if (score >= 75) return "bg-score-green/20 text-score-green border-score-green/30";
    if (score >= 50) return "bg-score-yellow/20 text-score-yellow border-score-yellow/30";
    return "bg-score-red/20 text-score-red border-score-red/30";
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary/50 rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-secondary/50 rounded-xl" />
              <div className="flex-1 h-4 bg-secondary/50 rounded" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (history.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Score History</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          No score history available yet. The score will be tracked over time.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Score History</h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {history.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 items-start"
            >
              {/* Score badge */}
              <div className={`relative z-10 w-12 h-12 rounded-xl border flex items-center justify-center text-sm font-bold ${getScoreColor(entry.score)}`}>
                {entry.score}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  {getChangeIcon(entry.change_amount)}
                  <span className={`font-medium ${getChangeColor(entry.change_amount)}`}>
                    {entry.change_amount !== null && entry.change_amount !== 0 && (
                      <>
                        {entry.change_amount > 0 ? "+" : ""}{entry.change_amount} points
                      </>
                    )}
                    {(!entry.change_amount || entry.change_amount === 0) && (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </span>
                </div>
                
                {entry.change_reason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {entry.change_reason}
                  </p>
                )}

                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span title={format(new Date(entry.recorded_at), "PPpp")}>
                    {formatDistanceToNow(new Date(entry.recorded_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {history.length >= 20 && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Showing last 20 score changes
        </p>
      )}
    </GlassCard>
  );
};
