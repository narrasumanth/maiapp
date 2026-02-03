import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingDown, MapPin, Sparkles, ArrowRight, Flame, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface GridCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  score?: number;
  trend?: "up" | "down";
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  delay?: number;
  glowColor?: string;
}

const GridCard = ({ title, subtitle, icon, score, trend, className, onClick, children, delay = 0, glowColor = "primary" }: GridCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative group text-left rounded-2xl p-5 overflow-hidden transition-all",
        "bg-secondary/40 backdrop-blur-xl border border-white/10",
        "hover:border-primary/40 hover:bg-secondary/60",
        className
      )}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated glow effect */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          glowColor === "green" && "bg-gradient-to-br from-score-green/20 to-transparent",
          glowColor === "red" && "bg-gradient-to-br from-score-red/20 to-transparent",
          glowColor === "primary" && "bg-gradient-to-br from-primary/20 to-transparent",
          glowColor === "purple" && "bg-gradient-to-br from-purple-500/20 to-transparent"
        )}
      />
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <motion.div 
            className="p-2 rounded-xl bg-primary/10 text-primary"
            animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          {score !== undefined && (
            <motion.div 
              className={cn(
                "text-2xl font-bold",
                score >= 75 ? "text-score-green" : score >= 50 ? "text-score-yellow" : "text-score-red"
              )}
              animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {score}
            </motion.div>
          )}
        </div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
      
      <motion.div
        className="absolute bottom-4 right-4"
        initial={{ opacity: 0, x: -10 }}
        animate={isHovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight className="w-4 h-4 text-primary" />
      </motion.div>
    </motion.button>
  );
};

// Floating particles component
const FloatingParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/40"
    initial={{ 
      x: Math.random() * 100 + "%", 
      y: "100%",
      opacity: 0 
    }}
    animate={{ 
      y: "-20%",
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut"
    }}
  />
);

export const PulseGrid = () => {
  const navigate = useNavigate();
  const [pulseScore, setPulseScore] = useState(92);
  
  // Simulate live score fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScore(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(85, Math.min(99, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {/* Daily Winner - Large */}
        <GridCard
          title="Tesla"
          subtitle="Today's Top Score"
          icon={<Trophy className="w-5 h-5" />}
          score={pulseScore}
          className="col-span-2 row-span-2 md:col-span-2"
          onClick={() => navigate("/result?q=Tesla")}
          delay={0}
          glowColor="green"
        >
          <div className="mt-4 flex items-center gap-2">
            <motion.span 
              className="px-2 py-1 rounded-full bg-score-green/10 text-score-green text-xs font-medium flex items-center gap-1"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-3 h-3" />
              Daily Winner
            </motion.span>
            <motion.span
              className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              LIVE
            </motion.span>
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
          delay={1}
          glowColor="red"
        >
          <motion.span 
            className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-score-red/10 text-score-red text-xs font-medium"
            animate={{ x: [0, -2, 2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Flame className="w-3 h-3" />
            -12%
          </motion.span>
        </GridCard>

        {/* Near Me */}
        <GridCard
          title="Near You"
          subtitle="Top Rated Nearby"
          icon={<MapPin className="w-5 h-5" />}
          className="col-span-1"
          onClick={() => navigate("/feed")}
          delay={2}
        >
          <motion.div 
            className="mt-2 text-xs text-muted-foreground flex items-center gap-1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-score-green"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            3 verified spots
          </motion.div>
        </GridCard>

        {/* Roulette */}
        <GridCard
          title="Can't Decide?"
          subtitle="Spin the Wheel"
          icon={<Sparkles className="w-5 h-5" />}
          className="col-span-2 bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/20"
          onClick={() => navigate("/roulette")}
          delay={3}
          glowColor="purple"
        >
          <motion.div
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium"
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0 0 rgba(var(--primary), 0)",
                "0 0 20px 4px rgba(var(--primary), 0.3)",
                "0 0 0 0 rgba(var(--primary), 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-3 h-3" />
            </motion.div>
            MAI Roulette
          </motion.div>
        </GridCard>
      </div>
    </div>
  );
};