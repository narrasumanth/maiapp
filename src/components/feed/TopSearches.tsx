import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Search, ArrowRight, Flame, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TopSearch {
  query: string;
  count: number;
  trend?: "hot" | "rising" | "stable";
}

type TimeRange = "4h" | "8h" | "12h" | "7d";

const TIME_RANGES: { value: TimeRange; label: string; hours: number }[] = [
  { value: "4h", label: "4 hrs", hours: 4 },
  { value: "8h", label: "8 hrs", hours: 8 },
  { value: "12h", label: "12 hrs", hours: 12 },
  { value: "7d", label: "7 days", hours: 168 },
];

const TopSearches = () => {
  const navigate = useNavigate();
  const [searches, setSearches] = useState<TopSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<TimeRange>("4h");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTopSearches = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    try {
      const rangeConfig = TIME_RANGES.find(r => r.value === range);
      const hoursAgo = rangeConfig?.hours || 4;
      
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hoursAgo);

      const { data } = await supabase
        .from("search_history")
        .select("query")
        .gte("created_at", startDate.toISOString())
        .not("query", "is", null);

      if (data) {
        // Count occurrences
        const countMap = new Map<string, number>();
        data.forEach(item => {
          const q = item.query.toLowerCase().trim();
          if (q.length > 1) {
            countMap.set(q, (countMap.get(q) || 0) + 1);
          }
        });

        // Sort by count and take top 8
        const sorted = Array.from(countMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([query, count], index) => ({
            query: query.charAt(0).toUpperCase() + query.slice(1),
            count,
            trend: index < 2 ? "hot" as const : index < 4 ? "rising" as const : "stable" as const,
          }));

        setSearches(sorted);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching top searches:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and range change
  useEffect(() => {
    fetchTopSearches(activeRange);
  }, [activeRange, fetchTopSearches]);

  // Auto-refresh every 4 hours (14400000 ms)
  useEffect(() => {
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      fetchTopSearches(activeRange);
    }, FOUR_HOURS);

    return () => clearInterval(interval);
  }, [activeRange, fetchTopSearches]);

  const handleSearch = (query: string) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

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

  if (isLoading && searches.length === 0) {
    return (
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Trending Searches</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Trending Searches</h2>
        </div>
        
        {/* Time Range Tabs */}
        <Tabs value={activeRange} onValueChange={handleRangeChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto bg-secondary/30 p-1 h-9">
            {TIME_RANGES.map(range => (
              <TabsTrigger 
                key={range.value} 
                value={range.value}
                className="text-xs px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Last updated indicator */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Clock className="w-3 h-3" />
        <span>Updated {formatLastUpdated()}</span>
        {isLoading && <span className="text-primary animate-pulse">• Refreshing...</span>}
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No searches in this time range</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {searches.map((search, index) => (
            <motion.button
              key={`${activeRange}-${search.query}`}
              onClick={() => handleSearch(search.query)}
              className="group relative flex items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {search.trend === "hot" && (
                    <Flame className="w-3.5 h-3.5 text-score-red shrink-0" />
                  )}
                  <span className="font-medium text-sm truncate">{search.query}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {search.count} {search.count === 1 ? "search" : "searches"}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default TopSearches;
