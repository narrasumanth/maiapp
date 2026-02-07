import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Zap, Clock, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PointsWinner {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_points: number;
  rank: number;
}

type TimeRange = "4h" | "8h" | "12h" | "24h" | "7d" | "all";

const TIME_RANGES: { value: TimeRange; label: string; hours: number | null }[] = [
  { value: "4h", label: "4h", hours: 4 },
  { value: "8h", label: "8h", hours: 8 },
  { value: "12h", label: "12h", hours: 12 },
  { value: "24h", label: "24h", hours: 24 },
  { value: "7d", label: "7d", hours: 168 },
  { value: "all", label: "All", hours: null },
];

const TopPointsWinners = () => {
  const [winners, setWinners] = useState<PointsWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<TimeRange>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTopWinners = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    try {
      const rangeConfig = TIME_RANGES.find(r => r.value === range);
      
      if (rangeConfig?.hours === null) {
        // All time - use user_points table
        const { data } = await supabase
          .from("user_points")
          .select("user_id, total_earned")
          .order("total_earned", { ascending: false })
          .limit(10);

        if (data) {
          // Fetch profiles for display names
          const userIds = data.map(d => d.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          const winnersData: PointsWinner[] = data.map((d, index) => ({
            user_id: d.user_id,
            display_name: profileMap.get(d.user_id)?.display_name || `User_${d.user_id.slice(0, 6)}`,
            avatar_url: profileMap.get(d.user_id)?.avatar_url || undefined,
            total_points: d.total_earned,
            rank: index + 1,
          }));

          setWinners(winnersData);
        }
      } else {
        // Time-based - use points_transactions table
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - rangeConfig.hours);

        const { data } = await supabase
          .from("points_transactions")
          .select("user_id, amount")
          .gte("created_at", startDate.toISOString())
          .gt("amount", 0);

        if (data) {
          // Aggregate points per user
          const pointsMap = new Map<string, number>();
          data.forEach(tx => {
            const current = pointsMap.get(tx.user_id) || 0;
            pointsMap.set(tx.user_id, current + tx.amount);
          });

          // Sort and take top 10
          const sorted = Array.from(pointsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

          // Fetch profiles
          const userIds = sorted.map(([uid]) => uid);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          const winnersData: PointsWinner[] = sorted.map(([userId, points], index) => ({
            user_id: userId,
            display_name: profileMap.get(userId)?.display_name || `User_${userId.slice(0, 6)}`,
            avatar_url: profileMap.get(userId)?.avatar_url || undefined,
            total_points: points,
            rank: index + 1,
          }));

          setWinners(winnersData);
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching top points winners:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopWinners(activeRange);
  }, [activeRange, fetchTopWinners]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTopWinners(activeRange);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeRange, fetchTopWinners]);

  const handleRangeChange = (value: string) => {
    setActiveRange(value as TimeRange);
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-primary" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-primary/70" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30";
    if (rank === 2) return "bg-gradient-to-r from-muted/40 to-muted/20 border-border";
    if (rank === 3) return "bg-gradient-to-r from-primary/15 to-primary/5 border-primary/20";
    return "bg-secondary/30 border-border/50";
  };

  if (isLoading && winners.length === 0) {
    return (
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Top Points Earners</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            <h2 className="font-bold text-base md:text-lg">Top Impulse Earners</h2>
          </div>
        </div>
        
        {/* Time Range Tabs */}
        <Tabs value={activeRange} onValueChange={handleRangeChange} className="w-full">
          <TabsList className="grid grid-cols-6 w-full bg-secondary/30 p-0.5 md:p-1 h-8 md:h-9">
            {TIME_RANGES.map(range => (
              <TabsTrigger 
                key={range.value} 
                value={range.value}
                className="text-[10px] md:text-xs px-0.5 md:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Last updated indicator */}
      <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">
        <Clock className="w-3 h-3" />
        <span>Updated {formatLastUpdated()}</span>
        {isLoading && <span className="text-primary animate-pulse">• Refreshing...</span>}
      </div>

      {winners.length === 0 ? (
        <div className="text-center py-6 md:py-8 text-muted-foreground">
          <Zap className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs md:text-sm">No Impulse earned in this time range</p>
          <p className="text-[10px] md:text-xs mt-1">Be the first to earn Impulse!</p>
        </div>
      ) : (
        <div className="space-y-1.5 md:space-y-2">
          {winners.map((winner, index) => (
            <motion.div
              key={`${activeRange}-${winner.user_id}`}
              className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl border transition-all ${getRankStyle(winner.rank)}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-6 md:w-8">
                {getRankIcon(winner.rank)}
              </div>

              {/* Avatar */}
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {winner.avatar_url ? (
                  <img src={winner.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs md:text-sm font-bold text-primary">
                    {winner.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs md:text-sm truncate">{winner.display_name}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                  {activeRange === "all" ? "Total earned" : `Last ${TIME_RANGES.find(r => r.value === activeRange)?.label}`}
                </p>
              </div>

              {/* Points */}
              <div className="flex items-center gap-0.5 md:gap-1 text-right flex-shrink-0">
                <Zap className="w-3 md:w-4 h-3 md:h-4 text-primary" />
                <span className="font-bold text-xs md:text-sm text-primary">{winner.total_points.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default TopPointsWinners;
