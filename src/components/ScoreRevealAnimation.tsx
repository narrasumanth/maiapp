import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Shield, Star, TrendingUp, Award } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface ScoreRevealAnimationProps {
  isVisible: boolean;
  searchQuery: string;
  onReveal: () => void;
}

export const ScoreRevealAnimation = ({ isVisible, searchQuery, onReveal }: ScoreRevealAnimationProps) => {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<"countdown" | "calculating" | "ready" | "reveal">("countdown");
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [scoreProgress, setScoreProgress] = useState(0);

  // Memoize onReveal to avoid dependency issues
  const handleReveal = useCallback(() => {
    onReveal();
  }, [onReveal]);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      setPhase("countdown");
      setCalculatedScore(0);
      setScoreProgress(0);
      return;
    }

    // Countdown phase
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 500);
      return () => clearTimeout(timer);
    }

    // Transition to "calculating" phase
    if (phase === "countdown" && countdown === 0) {
      setPhase("calculating");
    }
  }, [isVisible, countdown, phase]);

  // Calculating animation - dramatic score counting
  useEffect(() => {
    if (!isVisible || phase !== "calculating") return;

    const targetScore = Math.floor(Math.random() * 30) + 65; // Random score between 65-95
    const duration = 2500;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      
      setScoreProgress(easeOutProgress * 100);
      setCalculatedScore(Math.floor(easeOutProgress * targetScore));

      if (currentStep >= steps) {
        clearInterval(interval);
        setCalculatedScore(targetScore);
        setTimeout(() => setPhase("ready"), 500);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isVisible, phase]);

  // Handle the ready -> reveal transition
  useEffect(() => {
    if (!isVisible || phase !== "ready") return;
    
    const timer = setTimeout(() => {
      setPhase("reveal");
      setTimeout(() => {
        handleReveal();
      }, 600);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isVisible, phase, handleReveal]);

  const floatingIcons = [Sparkles, Zap, Shield, Star, TrendingUp, Award];

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-xl"
        >
          {/* Radial gradient background */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
          
          {/* Floating background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {floatingIcons.map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute text-primary/20"
                initial={{ 
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                  scale: 0 
                }}
                animate={{ 
                  y: [null, -150, 150],
                  scale: [0, 1.5, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.3 
                }}
              >
                <Icon className="w-16 h-16" />
              </motion.div>
            ))}
          </div>

          {/* Central content */}
          <div className="text-center relative z-10 px-4">
            <AnimatePresence mode="wait">
              {phase === "countdown" && (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="space-y-8"
                >
                  <motion.p className="text-2xl text-muted-foreground">
                    Preparing analysis for <span className="text-primary font-bold">{searchQuery}</span>
                  </motion.p>
                  
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-[12rem] font-black neon-text leading-none"
                  >
                    {countdown}
                  </motion.div>

                  <div className="flex justify-center gap-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-4 h-4 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === "calculating" && (
                <motion.div
                  key="calculating"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="space-y-8"
                >
                  <motion.h2 
                    className="text-3xl md:text-4xl font-bold text-foreground"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Calculating Trust Score...
                  </motion.h2>

                  {/* Giant Score Counter */}
                  <motion.div className="relative">
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 blur-3xl"
                      style={{
                        background: `radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)`,
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    
                    <motion.div
                      className={`text-[10rem] md:text-[14rem] font-black leading-none ${getScoreColor(calculatedScore)}`}
                      style={{ textShadow: '0 0 60px currentColor' }}
                    >
                      {calculatedScore}
                    </motion.div>
                  </motion.div>

                  {/* Progress bar */}
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-white/10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full"
                        style={{ width: `${scoreProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Analyzing sources...</span>
                      <span className="font-mono">{Math.floor(scoreProgress)}%</span>
                    </div>
                  </div>

                  {/* Data sources being checked */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {["Social Media", "Reviews", "News", "Public Records", "Web Presence"].map((source, i) => (
                      <motion.span
                        key={source}
                        className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-full text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                      >
                        ✓ {source}
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {phase === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="space-y-10"
                >
                  {/* Final score with celebration */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, damping: 10 }}
                    className="relative"
                  >
                    {/* Celebration rings */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 2, 2], opacity: [0.5, 0.2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-48 h-48 rounded-full border-4 border-primary/50" />
                    </motion.div>
                    
                    <motion.div
                      className={`text-[12rem] md:text-[16rem] font-black leading-none ${getScoreColor(calculatedScore)}`}
                      style={{ textShadow: '0 0 80px currentColor' }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {calculatedScore}
                    </motion.div>
                  </motion.div>

                  <motion.div
                    animate={{ 
                      textShadow: [
                        "0 0 20px hsl(var(--primary))",
                        "0 0 80px hsl(var(--primary))",
                        "0 0 20px hsl(var(--primary))"
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <h2 className="text-4xl md:text-6xl font-bold neon-text">
                      Score Calculated!
                    </h2>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    <span className="text-xl text-muted-foreground">Revealing full analysis...</span>
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </motion.div>
                </motion.div>
              )}

              {phase === "reveal" && (
                <motion.div
                  key="reveal"
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <Shield className="w-32 h-32 mx-auto text-primary" />
                  </motion.div>
                  <p className="text-3xl font-bold text-primary">Opening Results...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};