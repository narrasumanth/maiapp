import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Search, ArrowRight, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";

interface TopSearch {
  query: string;
  count: number;
  trend?: "hot" | "rising" | "stable";
}

const TopSearches = () => {
  const navigate = useNavigate();
  const [searches, setSearches] = useState<TopSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopSearches();
  }, []);

  const fetchTopSearches = async () => {
    try {
      // Get most searched queries from search_history in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data } = await supabase
        .from("search_history")
        .select("query")
        .gte("created_at", weekAgo.toISOString())
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
      }
    } catch (error) {
      console.error("Error fetching top searches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Top Searches</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (searches.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Top Searches</h2>
        </div>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {searches.map((search, index) => (
          <motion.button
            key={search.query}
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
    </GlassCard>
  );
};

export default TopSearches;
