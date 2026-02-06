import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, Activity } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const handleReveal = useCallback(() => {
    onReveal();
  }, [onReveal]);

  const actualTargetScore = targetScore ?? Math.floor(Math.random() * 30) + 65;

  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      setPhase("countdown");
      setDisplayedScore(0);
      setMeterProgress(0);
      return;
    }

    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), isMobile ? 300 : 500);
      return () => clearTimeout(timer);
    }

    if (phase === "countdown" && countdown === 0) {
      setPhase("calculating");
    }
  }, [isVisible, countdown, phase, isMobile]);

  useEffect(() => {
    if (!isVisible || phase !== "calculating") return;

    const duration = isMobile ? 1500 : 2500;
    const steps = isMobile ? 30 : 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      
      setMeterProgress(easeOutProgress * 100);
      setDisplayedScore(Math.floor(easeOutProgress * actualTargetScore));

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayedScore(actualTargetScore);
        setTimeout(() => setPhase("ready"), 300);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isVisible, phase, actualTargetScore, isMobile]);

  useEffect(() => {
    if (!isVisible || phase !== "ready") return;
    
    const timer = setTimeout(() => {
      setPhase("reveal");
      setTimeout(() => {
        handleReveal();
      }, 400);
    }, isMobile ? 1000 : 2000);
    
    return () => clearTimeout(timer);
  }, [isVisible, phase, handleReveal, isMobile]);

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

  // Mobile-optimized version - minimal animations
  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="text-center px-4">
              {phase === "countdown" && (
                <div className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    Checking pulse for <span className="text-primary font-bold">{searchQuery}</span>
                  </p>
                  <div className="text-8xl font-black neon-text">{countdown}</div>
                </div>
              )}

              {phase === "calculating" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Heart className="w-6 h-6 text-primary" fill="currentColor" />
                    <h2 className="text-2xl font-bold text-foreground">Reading Pulse...</h2>
                  </div>

                  {/* Simple progress bar */}
                  <div className="w-48 mx-auto">
                    <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-100 rounded-full"
                        style={{
                          width: `${meterProgress}%`,
                          background: getScoreColorHsl(displayedScore),
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className={`text-7xl font-black ${getScoreColor(displayedScore)}`}
                    style={{ textShadow: `0 0 30px ${getScoreColorHsl(displayedScore)}` }}
                  >
                    {displayedScore}
                  </div>
                </div>
              )}

              {phase === "ready" && (
                <div className="space-y-6">
                  <div
                    className={`text-8xl font-black ${getScoreColor(actualTargetScore)}`}
                    style={{ textShadow: `0 0 40px ${getScoreColorHsl(actualTargetScore)}` }}
                  >
                    {actualTargetScore}
                  </div>
                  <h2 className="text-3xl font-bold neon-text">Pulse Detected!</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Opening results...</span>
                  </div>
                </div>
              )}

              {phase === "reveal" && (
                <div className="space-y-4">
                  <Shield className="w-20 h-20 mx-auto text-primary" />
                  <p className="text-xl font-bold text-primary">Loading...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop version with full animations
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />

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

                  <motion.div className="relative max-w-xs mx-auto">
                    <div className="relative h-64 w-24 mx-auto rounded-2xl border-2 border-white/20 bg-secondary/30 overflow-hidden">
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 rounded-b-xl"
                        style={{
                          height: `${meterProgress}%`,
                          background: `linear-gradient(to top, ${getScoreColorHsl(displayedScore)}, ${getScoreColorHsl(displayedScore)}88)`,
                          boxShadow: `0 0 30px ${getScoreColorHsl(displayedScore)}`,
                        }}
                        transition={{ duration: 0.1 }}
                      />

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

                    <motion.div
                      className={`mt-6 text-8xl font-black ${getScoreColor(displayedScore)}`}
                      style={{ textShadow: `0 0 40px ${getScoreColorHsl(displayedScore)}` }}
                    >
                      {displayedScore}
                    </motion.div>
                  </motion.div>

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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, damping: 10 }}
                    className="relative"
                  >
                    <motion.div
                      className={`text-[12rem] md:text-[16rem] font-black leading-none ${getScoreColor(actualTargetScore)}`}
                      style={{ textShadow: `0 0 80px ${getScoreColorHsl(actualTargetScore)}` }}
                    >
                      {actualTargetScore}
                    </motion.div>
                  </motion.div>

                  <h2 className="text-4xl md:text-6xl font-bold neon-text">
                    Pulse Detected!
                  </h2>

                  <motion.div
                    className="flex items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Activity className="w-8 h-8 text-primary" />
                    <span className="text-xl text-muted-foreground">Revealing full analysis...</span>
                    <Activity className="w-8 h-8 text-primary" />
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
