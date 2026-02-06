import { useState, useEffect } from "react";
import { Users, TrendingUp, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { format, subDays, startOfDay } from "date-fns";

interface ProfileVisitorsProps {
  entityIds: string[];
}

interface VisitorStats {
  total: number;
  today: number;
  thisWeek: number;
  trend: number;
}

export const ProfileVisitors = ({ entityIds }: ProfileVisitorsProps) => {
  const [stats, setStats] = useState<VisitorStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    trend: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (entityIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchVisitorStats = async () => {
      try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const weekAgo = subDays(now, 7);
        const twoWeeksAgo = subDays(now, 14);

        // Total visits
        const { count: totalCount } = await supabase
          .from("entity_visits")
          .select("*", { count: "exact", head: true })
          .in("entity_id", entityIds);

        // Today's visits
        const { count: todayCount } = await supabase
          .from("entity_visits")
          .select("*", { count: "exact", head: true })
          .in("entity_id", entityIds)
          .gte("visited_at", todayStart.toISOString());

        // This week's visits
        const { count: weekCount } = await supabase
          .from("entity_visits")
          .select("*", { count: "exact", head: true })
          .in("entity_id", entityIds)
          .gte("visited_at", weekAgo.toISOString());

        // Last week's visits (for trend)
        const { count: lastWeekCount } = await supabase
          .from("entity_visits")
          .select("*", { count: "exact", head: true })
          .in("entity_id", entityIds)
          .gte("visited_at", twoWeeksAgo.toISOString())
          .lt("visited_at", weekAgo.toISOString());

        // Calculate trend
        const currentWeek = weekCount || 0;
        const previousWeek = lastWeekCount || 0;
        const trend = previousWeek > 0 
          ? Math.round(((currentWeek - previousWeek) / previousWeek) * 100)
          : currentWeek > 0 ? 100 : 0;

        setStats({
          total: totalCount || 0,
          today: todayCount || 0,
          thisWeek: currentWeek,
          trend,
        });
      } catch (error) {
        console.error("Error fetching visitor stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitorStats();
  }, [entityIds]);

  if (entityIds.length === 0) {
    return null;
  }

  const statItems = [
    {
      label: "Total Views",
      value: stats.total,
      icon: Eye,
      color: "text-primary",
    },
    {
      label: "Today",
      value: stats.today,
      icon: Calendar,
      color: "text-score-green",
    },
    {
      label: "This Week",
      value: stats.thisWeek,
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Trend",
      value: `${stats.trend >= 0 ? '+' : ''}${stats.trend}%`,
      icon: TrendingUp,
      color: stats.trend >= 0 ? "text-score-green" : "text-score-red",
    },
  ];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Profile Views</h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-secondary/30 animate-pulse">
              <div className="h-4 w-16 bg-secondary rounded mb-2" />
              <div className="h-6 w-12 bg-secondary rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-secondary/20 border border-border/50"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                {item.label}
              </div>
              <p className={`text-xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
