import { motion } from "framer-motion";
import { useMemo } from "react";
import { Activity, TrendingUp, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PulseMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const getScoreInfo = (score: number) => {
  if (score >= 86) return { 
    label: "Strong Pulse Signal", 
    color: "hsl(180, 70%, 55%)", 
    glowColor: "hsl(180, 70%, 55%)",
    bgClass: "from-score-diamond/20 to-score-diamond/5",
    textClass: "text-score-diamond"
  };
  if (score >= 61) return { 
    label: "Positive Pulse", 
    color: "hsl(152, 60%, 52%)", 
    glowColor: "hsl(152, 60%, 52%)",
    bgClass: "from-score-green/20 to-score-green/5",
    textClass: "text-score-green"
  };
  if (score >= 40) return { 
    label: "Mixed Pulse", 
    color: "hsl(38, 92%, 50%)", 
    glowColor: "hsl(38, 92%, 50%)",
    bgClass: "from-score-yellow/20 to-score-yellow/5",
    textClass: "text-score-yellow"
  };
  return { 
    label: "Low Pulse", 
    color: "hsl(0, 72%, 55%)", 
    glowColor: "hsl(0, 72%, 55%)",
    bgClass: "from-score-red/20 to-score-red/5",
    textClass: "text-score-red"
  };
};

export const PulseMeter = ({ score, size = "md", showLabel = true }: PulseMeterProps) => {
  const isMobile = useIsMobile();
  const info = getScoreInfo(score);
  
  // Responsive size configuration
  const getResponsiveConfig = () => {
    if (isMobile) {
      // Mobile: use smaller, fluid sizes
      return { 
        width: "100%", 
        maxWidth: size === "lg" ? 280 : size === "md" ? 240 : 160,
        height: size === "lg" ? 120 : size === "md" ? 100 : 70,
        fontSize: size === "lg" ? "text-5xl" : size === "md" ? "text-4xl" : "text-3xl",
        subSize: "text-xs"
      };
    }
    // Desktop: original fixed sizes
    return {
      width: size === "lg" ? 400 : size === "md" ? 320 : 200,
      maxWidth: undefined,
      height: size === "lg" ? 180 : size === "md" ? 140 : 100,
      fontSize: size === "lg" ? "text-7xl" : size === "md" ? "text-6xl" : "text-4xl",
      subSize: size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs"
    };
  };

  const config = getResponsiveConfig();
  const numericWidth = typeof config.width === "number" ? config.width : (config.maxWidth || 280);
  
  // Generate pulse wave path
  const wavePath = useMemo(() => {
    const width = numericWidth;
    const height = config.height * 0.4;
    const centerY = height / 2;
    const amplitude = height * 0.35;
    
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
  }, [numericWidth, config.height]);

  // Simplified mobile version - no heavy animations
  if (isMobile) {
    return (
      <div className="flex flex-col items-center w-full">
        <div 
          className={`relative rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br ${info.bgClass} w-full`}
          style={{ maxWidth: config.maxWidth, minHeight: config.height }}
        >
          {/* Simple grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: '16px 16px'
            }}
          />

          {/* Score Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full py-4 px-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className={`w-3 h-3 ${info.textClass}`} />
              <span className={`text-[10px] font-medium uppercase tracking-widest ${info.textClass}`}>
                Live Pulse
              </span>
            </div>

            <span 
              className={`${config.fontSize} font-bold tracking-tight`}
              style={{ color: info.color }}
            >
              {score}
            </span>

            {showLabel && (
              <span className={`text-xs font-semibold uppercase tracking-wider mt-1 ${info.textClass}`}>
                {info.label}
              </span>
            )}
          </div>

          {/* Simple progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <div
              className="h-full rounded-full"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${info.color})`,
                width: `${score}%`
              }}
            />
          </div>
        </div>

        {/* Micro stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3 h-3" />
            <span className="text-[10px]">Real-time</span>
          </div>
          <div className="w-px h-2.5 bg-border" />
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px]">AI Analyzed</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version with full animations
  return (
    <div className="relative flex flex-col items-center">
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
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Pulse Wave Animation */}
          <svg 
            className="absolute top-1/2 left-0 -translate-y-1/2 w-full opacity-30"
            height={config.height * 0.4}
            viewBox={`0 0 ${numericWidth} ${config.height * 0.4}`}
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
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-3xl" style={{ borderColor: `${info.color}30` }} />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 rounded-tr-3xl" style={{ borderColor: `${info.color}30` }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 rounded-bl-3xl" style={{ borderColor: `${info.color}30` }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-3xl" style={{ borderColor: `${info.color}30` }} />
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
