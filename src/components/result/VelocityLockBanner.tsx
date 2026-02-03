import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface VelocityLock {
  id: string;
  locked_at: string;
  unlocks_at: string;
  reason: string;
  score_before: number;
  score_after: number;
  velocity_percent: number;
}

interface VelocityLockBannerProps {
  entityId: string;
}

export const VelocityLockBanner = ({ entityId }: VelocityLockBannerProps) => {
  const [lock, setLock] = useState<VelocityLock | null>(null);

  useEffect(() => {
    fetchLock();

    const channel = supabase
      .channel(`velocity-lock-${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "entity_velocity_locks",
          filter: `entity_id=eq.${entityId}`,
        },
        (payload) => {
          setLock(payload.new as VelocityLock);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId]);

  const fetchLock = async () => {
    const { data } = await supabase
      .from("entity_velocity_locks")
      .select("*")
      .eq("entity_id", entityId)
      .gt("unlocks_at", new Date().toISOString())
      .order("locked_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setLock(data);
    }
  };

  if (!lock) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-score-yellow/10 border border-score-yellow/30 rounded-xl p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-score-yellow shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-score-yellow mb-1">
            Voting Temporarily Paused
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            {lock.reason}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              Unlocks {formatDistanceToNow(new Date(lock.unlocks_at), { addSuffix: true })}
            </span>
            <span className="text-score-red">
              {lock.velocity_percent}% change detected
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
