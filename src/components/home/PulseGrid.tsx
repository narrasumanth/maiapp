import { motion } from "framer-motion";
import { Trophy, TrendingDown, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface GridCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  score?: number;
  trend?: "up" | "down";
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const GridCard = ({ title, subtitle, icon, score, trend, className, onClick, children }: GridCardProps) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "relative group text-left rounded-2xl p-5 overflow-hidden transition-all",
      "bg-secondary/40 backdrop-blur-xl border border-white/10",
      "hover:border-primary/30 hover:bg-secondary/60",
      className
    )}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        {score !== undefined && (
          <div className={cn(
            "text-2xl font-bold",
            score >= 75 ? "text-score-green" : score >= 50 ? "text-score-yellow" : "text-score-red"
          )}>
            {score}
          </div>
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
    <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.button>
);

export const PulseGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
      {/* Daily Winner - Large */}
      <GridCard
        title="Tesla"
        subtitle="Today's Top Score"
        icon={<Trophy className="w-5 h-5" />}
        score={92}
        className="col-span-2 row-span-2 md:col-span-2"
        onClick={() => navigate("/result?q=Tesla")}
      >
        <div className="mt-4 flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-score-green/10 text-score-green text-xs font-medium">
            🏆 Daily Winner
          </span>
        </div>
      </GridCard>

      {/* Controversy */}
      <GridCard
        title="Meta"
        subtitle="Most Volatile Today"
        icon={<TrendingDown className="w-5 h-5" />}
        score={58}
        className="col-span-1"
        onClick={() => navigate("/result?q=Meta")}
      >
        <span className="mt-2 inline-block px-2 py-1 rounded-full bg-score-red/10 text-score-red text-xs font-medium">
          📉 -12%
        </span>
      </GridCard>

      {/* Near Me */}
      <GridCard
        title="Near You"
        subtitle="Top Rated Nearby"
        icon={<MapPin className="w-5 h-5" />}
        className="col-span-1"
        onClick={() => navigate("/feed")}
      >
        <div className="mt-2 text-xs text-muted-foreground">
          📍 3 verified spots
        </div>
      </GridCard>

      {/* Roulette */}
      <GridCard
        title="Can't Decide?"
        subtitle="Spin the Wheel"
        icon={<Sparkles className="w-5 h-5" />}
        className="col-span-2 bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/20"
        onClick={() => navigate("/roulette")}
      >
        <motion.div
          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-3 h-3" />
          MAI Roulette
        </motion.div>
      </GridCard>
    </div>
  );
};
