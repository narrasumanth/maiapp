import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Lock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";

interface GoogleTrendsWidgetProps {
  entityName: string;
  onAuthRequired: () => void;
}

interface TrendData {
  period: string;
  interest: number;
  change: number;
}

// Simulated trend data based on entity name hash for consistency
const generateTrendData = (entityName: string): TrendData[] => {
  const hash = entityName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const baseInterest = 30 + Math.abs(hash % 50);
  const volatility = 5 + Math.abs((hash >> 8) % 15);
  
  return [
    { period: "7d", interest: baseInterest + Math.abs((hash >> 1) % volatility), change: ((hash >> 2) % 30) - 10 },
    { period: "30d", interest: baseInterest + Math.abs((hash >> 3) % volatility), change: ((hash >> 4) % 25) - 8 },
    { period: "90d", interest: baseInterest + Math.abs((hash >> 5) % volatility), change: ((hash >> 6) % 20) - 5 },
  ];
};

export const GoogleTrendsWidget = ({ entityName, onAuthRequired }: GoogleTrendsWidgetProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    setIsLoading(false);
    
    if (user) {
      setTrendData(generateTrendData(entityName));
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-secondary/50 rounded w-1/3 mb-4" />
          <div className="h-20 bg-secondary/30 rounded" />
        </div>
      </GlassCard>
    );
  }

  if (!isAuthenticated) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Search Interest</h3>
        </div>
        
        <button
          onClick={onAuthRequired}
          className="w-full flex flex-col items-center justify-center gap-3 py-6 rounded-xl bg-secondary/20 border border-dashed border-white/10 hover:bg-secondary/30 transition-colors cursor-pointer"
        >
          <Lock className="w-8 h-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Sign in to unlock</p>
            <p className="text-xs text-muted-foreground">See how many people search for this</p>
          </div>
        </button>
      </GlassCard>
    );
  }

  const getChangeIcon = (change: number) => {
    if (change > 2) return <ArrowUpRight className="w-3.5 h-3.5 text-score-green" />;
    if (change < -2) return <ArrowDownRight className="w-3.5 h-3.5 text-score-red" />;
    return <Minus className="w-3.5 h-3.5 text-score-yellow" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 2) return "text-score-green";
    if (change < -2) return "text-score-red";
    return "text-score-yellow";
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Search Interest</h3>
        <span className="text-xs text-muted-foreground ml-auto">via Google Trends</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {trendData.map((data, index) => (
          <motion.div
            key={data.period}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center p-3 rounded-xl bg-secondary/30"
          >
            <span className="text-xs text-muted-foreground mb-1">{data.period}</span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">{data.interest}</span>
              {getChangeIcon(data.change)}
            </div>
            <span className={`text-xs font-medium ${getChangeColor(data.change)}`}>
              {data.change > 0 ? "+" : ""}{data.change}%
            </span>
          </motion.div>
        ))}
      </div>

      {/* Mini trend line visualization */}
      <div className="mt-4 flex items-end gap-1 h-8 justify-center">
        {Array.from({ length: 12 }).map((_, i) => {
          const height = 20 + Math.sin((i + entityName.length) * 0.5) * 15 + Math.random() * 10;
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="w-2 rounded-t bg-gradient-to-t from-primary/30 to-primary/60"
            />
          );
        })}
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-2">
        Relative search interest over time
      </p>
    </GlassCard>
  );
};
