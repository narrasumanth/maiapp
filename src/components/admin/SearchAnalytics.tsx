import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Globe, MapPin, TrendingUp, RefreshCw, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface SearchStats {
  totalSearches: number;
  uniqueVisitors: number;
  topCountries: { country: string; count: number }[];
  topQueries: { query: string; count: number }[];
  recentSearches: {
    id: string;
    query: string;
    country: string | null;
    city: string | null;
    created_at: string;
  }[];
}

interface DailyStats {
  date: string;
  searches: number;
  visitors: number;
}

export function SearchAnalytics() {
  const [stats, setStats] = useState<SearchStats>({
    totalSearches: 0,
    uniqueVisitors: 0,
    topCountries: [],
    topQueries: [],
    recentSearches: [],
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSearchStats();
  }, [timeRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "all":
        return new Date(0);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const loadSearchStats = async () => {
    setIsLoading(true);
    const startDate = getDateRange().toISOString();

    try {
      // Load all search history with location data
      const { data: searches, error } = await supabase
        .from("search_history")
        .select("id, query, country, city, ip_hash, created_at")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Error loading search stats:", error);
        setIsLoading(false);
        return;
      }

      const searchData = searches || [];

      // Calculate stats
      const totalSearches = searchData.length;
      const uniqueVisitors = new Set(searchData.map(s => s.ip_hash).filter(Boolean)).size;

      // Top countries
      const countryCounts: Record<string, number> = {};
      searchData.forEach(s => {
        if (s.country) {
          countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
        }
      });
      const topCountries = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top queries
      const queryCounts: Record<string, number> = {};
      searchData.forEach(s => {
        const normalized = s.query.toLowerCase().trim();
        queryCounts[normalized] = (queryCounts[normalized] || 0) + 1;
      });
      const topQueries = Object.entries(queryCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Daily stats for chart
      const dailyCounts: Record<string, { searches: number; visitors: Set<string> }> = {};
      searchData.forEach(s => {
        const date = new Date(s.created_at).toLocaleDateString();
        if (!dailyCounts[date]) {
          dailyCounts[date] = { searches: 0, visitors: new Set() };
        }
        dailyCounts[date].searches++;
        if (s.ip_hash) {
          dailyCounts[date].visitors.add(s.ip_hash);
        }
      });
      const daily = Object.entries(dailyCounts)
        .map(([date, data]) => ({
          date,
          searches: data.searches,
          visitors: data.visitors.size,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 14)
        .reverse();

      setStats({
        totalSearches,
        uniqueVisitors,
        topCountries,
        topQueries,
        recentSearches: searchData.slice(0, 20).map(s => ({
          id: s.id,
          query: s.query,
          country: s.country,
          city: s.city,
          created_at: s.created_at,
        })),
      });
      setDailyStats(daily);
    } catch (err) {
      console.error("Error loading search analytics:", err);
    }

    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="bg-secondary/20 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search Analytics
            </CardTitle>
            <CardDescription>Track search volume and visitor locations</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-28">
                <Calendar className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadSearchStats} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Searches</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalSearches.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Unique Visitors</span>
            </div>
            <p className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Countries</span>
            </div>
            <p className="text-2xl font-bold">{stats.topCountries.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Unique Queries</span>
            </div>
            <p className="text-2xl font-bold">{stats.topQueries.length}</p>
          </div>
        </div>

        {/* Daily Trend */}
        {dailyStats.length > 0 && (
          <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
            <h4 className="text-sm font-medium mb-3">Daily Trend</h4>
            <div className="flex items-end gap-1 h-24">
              {dailyStats.map((day, i) => {
                const maxSearches = Math.max(...dailyStats.map(d => d.searches));
                const height = maxSearches > 0 ? (day.searches / maxSearches) * 100 : 0;
                return (
                  <motion.div
                    key={day.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-1 bg-primary/60 rounded-t hover:bg-primary transition-colors cursor-pointer group relative min-h-[4px]"
                    title={`${day.date}: ${day.searches} searches`}
                  >
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                      {day.date}: {day.searches}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{dailyStats[0]?.date}</span>
              <span>{dailyStats[dailyStats.length - 1]?.date}</span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Countries */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Top Countries
            </h4>
            <div className="space-y-2">
              {stats.topCountries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No location data yet
                </p>
              ) : (
                stats.topCountries.map((item, i) => (
                  <div key={item.country} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-5">{i + 1}.</span>
                      <span className="text-sm">{item.country}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Queries */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Searches
            </h4>
            <div className="space-y-2">
              {stats.topQueries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No searches yet
                </p>
              ) : (
                stats.topQueries.map((item, i) => (
                  <div key={item.query} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-5">{i + 1}.</span>
                      <span className="text-sm truncate max-w-[150px]">{item.query}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Searches */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Searches</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentSearches.map((search) => (
                <TableRow key={search.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {search.query}
                  </TableCell>
                  <TableCell>
                    {search.country ? (
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {search.city ? `${search.city}, ` : ""}{search.country}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(search.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {stats.recentSearches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No searches recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
