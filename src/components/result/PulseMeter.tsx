import { motion } from "framer-motion";
import { useMemo } from "react";
import { Activity, TrendingUp, Zap } from "lucide-react";

interface PulseMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const getScoreInfo = (score: number) => {
  if (score >= 90) return { 
    label: "Diamond", 
    color: "hsl(180, 70%, 55%)", 
    glowColor: "hsl(180, 70%, 55%)",
    bgClass: "from-score-diamond/20 to-score-diamond/5",
    textClass: "text-score-diamond"
  };
  if (score >= 75) return { 
    label: "Trusted", 
    color: "hsl(152, 60%, 52%)", 
    glowColor: "hsl(152, 60%, 52%)",
    bgClass: "from-score-green/20 to-score-green/5",
    textClass: "text-score-green"
  };
  if (score >= 50) return { 
    label: "Mixed", 
    color: "hsl(38, 92%, 50%)", 
    glowColor: "hsl(38, 92%, 50%)",
    bgClass: "from-score-yellow/20 to-score-yellow/5",
    textClass: "text-score-yellow"
  };
  return { 
    label: "Risk", 
    color: "hsl(0, 72%, 55%)", 
    glowColor: "hsl(0, 72%, 55%)",
    bgClass: "from-score-red/20 to-score-red/5",
    textClass: "text-score-red"
  };
};

const sizeConfig = {
  sm: { width: 200, height: 100, fontSize: "text-4xl", subSize: "text-xs" },
  md: { width: 320, height: 140, fontSize: "text-6xl", subSize: "text-sm" },
  lg: { width: 400, height: 180, fontSize: "text-7xl", subSize: "text-base" },
};

export const PulseMeter = ({ score, size = "md", showLabel = true }: PulseMeterProps) => {
  const config = sizeConfig[size];
  const info = getScoreInfo(score);
  
  // Generate pulse wave path
  const wavePath = useMemo(() => {
    const width = config.width;
    const height = config.height * 0.4;
    const centerY = height / 2;
    const amplitude = height * 0.35;
    
    // Create a heartbeat/EKG-style path
    const segments = [
      `M 0 ${centerY}`,
      `L ${width * 0.15} ${centerY}`,
      `L ${width * 0.2} ${centerY - amplitude * 0.3}`,
      `L ${width * 0.25} ${centerY}`,
      `L ${width * 0.35} ${centerY}`,
      `L ${width * 0.38} ${centerY + amplitude * 0.2}`,
      `L ${width * 0.42} ${centerY - amplitude}`,
      `L ${width * 0.48} ${centerY + amplitude * 0.6}`,
      `L ${width * 0.52} ${centerY}`,
      `L ${width * 0.65} ${centerY}`,
      `L ${width * 0.7} ${centerY - amplitude * 0.2}`,
      `L ${width * 0.75} ${centerY}`,
      `L ${width} ${centerY}`,
    ];
    
    return segments.join(" ");
  }, [config]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Main Score Display */}
      <div className="relative">
        {/* Ambient Glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-40 blur-3xl"
          style={{ background: info.color }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Glass Container */}
        <div 
          className={`relative rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden bg-gradient-to-br ${info.bgClass}`}
          style={{ width: config.width, minHeight: config.height }}
        >
          {/* Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Pulse Wave Animation - Behind Score */}
          <svg 
            className="absolute top-1/2 left-0 -translate-y-1/2 w-full opacity-30"
            height={config.height * 0.4}
            viewBox={`0 0 ${config.width} ${config.height * 0.4}`}
            preserveAspectRatio="none"
          >
            <motion.path
              d={wavePath}
              fill="none"
              stroke={info.color}
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Animated trace */}
            <motion.path
              d={wavePath}
              fill="none"
              stroke={info.color}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${info.color})` }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            />
          </svg>

          {/* Score Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full py-6 px-4">
            {/* Top Label */}
            <motion.div
              className="flex items-center gap-1.5 mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Activity className={`w-4 h-4 ${info.textClass}`} />
              <span className={`${config.subSize} font-medium uppercase tracking-widest ${info.textClass}`}>
                Live Pulse
              </span>
            </motion.div>

            {/* Score Number */}
            <motion.div
              className="flex items-baseline gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <span 
                className={`${config.fontSize} font-bold tracking-tight`}
                style={{ 
                  color: info.color,
                  textShadow: `0 0 40px ${info.glowColor}40`
                }}
              >
                {score}
              </span>
            </motion.div>

            {/* Status Label */}
            {showLabel && (
              <motion.div
                className="flex items-center gap-2 mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className={`${config.subSize} font-semibold uppercase tracking-wider ${info.textClass}`}>
                  {info.label}
                </span>
              </motion.div>
            )}
          </div>

          {/* Bottom Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${info.color})`,
                boxShadow: `0 0 20px ${info.color}`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          {/* Corner Accents */}
          <div 
            className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-3xl"
            style={{ borderColor: `${info.color}30` }}
          />
          <div 
            className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 rounded-tr-3xl"
            style={{ borderColor: `${info.color}30` }}
          />
          <div 
            className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 rounded-bl-3xl"
            style={{ borderColor: `${info.color}30` }}
          />
          <div 
            className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-3xl"
            style={{ borderColor: `${info.color}30` }}
          />
        </div>
      </div>

      {/* Micro Stats Row */}
      <motion.div
        className="flex items-center gap-6 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs">Real-time</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs">AI Analyzed</span>
        </div>
      </motion.div>
    </div>
  );
};
