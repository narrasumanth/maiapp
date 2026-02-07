import { motion } from "framer-motion";
import { useMemo } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 86) return { class: "score-diamond", color: "hsl(185, 100%, 60%)", label: "Strong Pulse Signal" };
  if (score >= 61) return { class: "score-green", color: "hsl(142, 76%, 50%)", label: "Positive Pulse" };
  if (score >= 40) return { class: "score-yellow", color: "hsl(45, 100%, 55%)", label: "Mixed Pulse" };
  return { class: "score-red", color: "hsl(0, 84%, 60%)", label: "Low Pulse" };
};

const sizeConfig = {
  sm: { size: 120, stroke: 8, fontSize: "text-2xl" },
  md: { size: 200, stroke: 12, fontSize: "text-5xl" },
  lg: { size: 280, stroke: 16, fontSize: "text-7xl" },
};

export const ScoreGauge = ({ score, size = "md", animated = true }: ScoreGaugeProps) => {
  const config = sizeConfig[size];
  const scoreInfo = getScoreColor(score);
  
  const circumference = useMemo(() => {
    const radius = (config.size - config.stroke) / 2;
    return 2 * Math.PI * radius;
  }, [config]);

  const strokeDashoffset = useMemo(() => {
    return circumference - (score / 100) * circumference;
  }, [circumference, score]);

  const radius = (config.size - config.stroke) / 2;
  const center = config.size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl opacity-30"
        style={{ background: scoreInfo.color }}
      />
      
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(222, 47%, 12%)"
          strokeWidth={config.stroke}
        />
        
        {/* Score Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={scoreInfo.color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 10px ${scoreInfo.color})`,
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className={`${config.fontSize} font-bold`}
          style={{ color: scoreInfo.color }}
          initial={animated ? { opacity: 0, scale: 0.5 } : {}}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <motion.span 
          className="text-sm text-muted-foreground font-medium uppercase tracking-wider"
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {scoreInfo.label}
        </motion.span>
      </div>
    </div>
  );
};
