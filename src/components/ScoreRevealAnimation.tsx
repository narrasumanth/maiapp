import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Shield, Star, TrendingUp, Award, Heart, Activity } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface ScoreRevealAnimationProps {
  isVisible: boolean;
  searchQuery: string;
  targetScore?: number;
  onReveal: () => void;
}

export const ScoreRevealAnimation = ({ isVisible, searchQuery, targetScore, onReveal }: ScoreRevealAnimationProps) => {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<"countdown" | "calculating" | "ready" | "reveal">("countdown");
  const [displayedScore, setDisplayedScore] = useState(0);
  const [meterProgress, setMeterProgress] = useState(0);

  // Memoize onReveal to avoid dependency issues
  const handleReveal = useCallback(() => {
    onReveal();
  }, [onReveal]);

  // Determine the actual target score to animate to
  const actualTargetScore = targetScore ?? Math.floor(Math.random() * 30) + 65;

  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      setPhase("countdown");
      setDisplayedScore(0);
      setMeterProgress(0);
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

  // Calculating animation - meter rises to actual score
  useEffect(() => {
    if (!isVisible || phase !== "calculating") return;

    const duration = 2500;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      
      setMeterProgress(easeOutProgress * 100);
      setDisplayedScore(Math.floor(easeOutProgress * actualTargetScore));

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayedScore(actualTargetScore);
        setTimeout(() => setPhase("ready"), 500);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isVisible, phase, actualTargetScore]);

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
    if (score >= 90) return "text-score-diamond";
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const getScoreColorHsl = (score: number) => {
    if (score >= 90) return "hsl(180, 80%, 50%)";
    if (score >= 75) return "hsl(160, 70%, 45%)";
    if (score >= 50) return "hsl(45, 95%, 55%)";
    return "hsl(5, 85%, 55%)";
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
                    Checking pulse for <span className="text-primary font-bold">{searchQuery}</span>
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
                  <motion.div className="flex items-center justify-center gap-3 mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <Heart className="w-8 h-8 text-primary" fill="currentColor" />
                    </motion.div>
                    <motion.h2 
                      className="text-3xl md:text-4xl font-bold text-foreground"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Reading Pulse...
                    </motion.h2>
                  </motion.div>

                  {/* Pulse Meter - Score rising like a health monitor */}
                  <motion.div className="relative max-w-xs mx-auto">
                    {/* Meter Container */}
                    <div className="relative h-64 w-24 mx-auto rounded-2xl border-2 border-white/20 bg-secondary/30 overflow-hidden">
                      {/* Meter Fill */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 rounded-b-xl"
                        style={{
                          height: `${meterProgress}%`,
                          background: `linear-gradient(to top, ${getScoreColorHsl(displayedScore)}, ${getScoreColorHsl(displayedScore)}88)`,
                          boxShadow: `0 0 30px ${getScoreColorHsl(displayedScore)}`,
                        }}
                        transition={{ duration: 0.1 }}
                      />
                      
                      {/* Pulse Wave Effect */}
                      <motion.div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `linear-gradient(180deg, transparent 0%, ${getScoreColorHsl(displayedScore)} 50%, transparent 100%)`,
                        }}
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />

                      {/* Meter Scale Lines */}
                      {[25, 50, 75].map((mark) => (
                        <div
                          key={mark}
                          className="absolute left-0 right-0 border-t border-white/10"
                          style={{ bottom: `${mark}%` }}
                        >
                          <span className="absolute -right-8 -top-2 text-xs text-muted-foreground">
                            {mark}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Score Display */}
                    <motion.div
                      className={`mt-6 text-8xl font-black ${getScoreColor(displayedScore)}`}
                      style={{ textShadow: `0 0 40px ${getScoreColorHsl(displayedScore)}` }}
                    >
                      {displayedScore}
                    </motion.div>
                  </motion.div>

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
                      className={`text-[12rem] md:text-[16rem] font-black leading-none ${getScoreColor(actualTargetScore)}`}
                      style={{ textShadow: `0 0 80px ${getScoreColorHsl(actualTargetScore)}` }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {actualTargetScore}
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
                      Pulse Detected!
                    </h2>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Activity className="w-8 h-8 text-primary animate-pulse" />
                    <span className="text-xl text-muted-foreground">Revealing full analysis...</span>
                    <Activity className="w-8 h-8 text-primary animate-pulse" />
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
