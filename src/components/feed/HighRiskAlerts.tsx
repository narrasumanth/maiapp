import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, ShieldOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  name: string;
  score: number;
  warning: string;
  reportCount: number;
}

export const HighRiskAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Fetch low-score entities
        const { data, error } = await supabase
          .from("entity_scores")
          .select(`
            id,
            score,
            negative_reactions,
            entities (id, name)
          `)
          .lt("score", 30)
          .order("score", { ascending: true })
          .limit(5);

        if (error) {
          console.error("Error fetching alerts:", error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const alertData: Alert[] = data
            .filter((item) => item.entities)
            .map((item) => ({
              id: item.entities?.id || item.id,
              name: item.entities?.name || "Unknown",
              score: item.score,
              warning: item.score < 15 ? "High risk detected" : "Low trust score",
              reportCount: item.negative_reactions || 0,
            }));

          setAlerts(alertData);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <GlassCard className="p-6 border-border/50">
        <div className="flex items-center gap-2 mb-4">
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

  // Empty state - this is actually good!
  if (alerts.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-muted-foreground">High Risk Alerts</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-score-green/10 border border-score-green/20 flex items-center justify-center mx-auto mb-3"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-score-green" />
          </motion.div>

          <h3 className="font-medium text-sm mb-1 text-score-green">All clear!</h3>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
            No high-risk entities detected. The pulse is healthy.
          </p>
        </motion.div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border-score-red/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-score-red" />
        <h2 className="text-lg font-bold">High Risk Alerts</h2>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            onClick={() => handleClick(alert.name)}
            className="p-4 rounded-xl bg-score-red/5 border border-score-red/10 hover:bg-score-red/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl font-bold text-score-red">{alert.score}</span>
              <span className="text-lg">🚨</span>
            </div>
            <p className="font-medium text-sm truncate flex items-center gap-1.5">
              {alert.name}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-xs text-score-red/80 mt-1">{alert.warning}</p>
            {alert.reportCount > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {alert.reportCount} reports
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

export default HighRiskAlerts;
