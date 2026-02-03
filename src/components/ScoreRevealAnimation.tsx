import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Shield, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface ScoreRevealAnimationProps {
  isVisible: boolean;
  searchQuery: string;
  onReveal: () => void;
}

export const ScoreRevealAnimation = ({ isVisible, searchQuery, onReveal }: ScoreRevealAnimationProps) => {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<"countdown" | "ready" | "reveal">("countdown");

  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      setPhase("countdown");
      return;
    }

    // Countdown phase
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 600);
      return () => clearTimeout(timer);
    }

    // Transition to "ready" phase
    if (phase === "countdown" && countdown === 0) {
      setPhase("ready");
    }
  }, [isVisible, countdown, phase]);

  // Handle the ready -> reveal transition separately
  useEffect(() => {
    if (!isVisible || phase !== "ready") return;
    
    const timer = setTimeout(() => {
      setPhase("reveal");
      // Navigate after a brief reveal animation
      setTimeout(() => {
        onReveal();
      }, 400);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [isVisible, phase, onReveal]);

  const floatingIcons = [Sparkles, Zap, Shield, Star];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
        >
          {/* Floating background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {floatingIcons.map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute text-primary/20"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  scale: 0 
                }}
                animate={{ 
                  y: [null, -100, 100],
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5 
                }}
              >
                <Icon className="w-12 h-12" />
              </motion.div>
            ))}
          </div>

          {/* Central content */}
          <div className="text-center relative z-10">
            <AnimatePresence mode="wait">
              {phase === "countdown" && (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="space-y-6"
                >
                  <motion.p className="text-xl text-muted-foreground">
                    Analyzing <span className="text-primary font-semibold">{searchQuery}</span>
                  </motion.p>
                  
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-9xl font-bold neon-text"
                  >
                    {countdown}
                  </motion.div>

                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-3 h-3 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="space-y-8"
                >
                  <motion.div
                    animate={{ 
                      textShadow: [
                        "0 0 20px hsl(var(--primary))",
                        "0 0 60px hsl(var(--primary))",
                        "0 0 20px hsl(var(--primary))"
                      ]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">
                      <span className="text-foreground">Are you ready for</span>
                    </h2>
                    <h2 className="text-5xl md:text-7xl font-bold neon-text">
                      Your MAI Score?
                    </h2>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    <span className="text-lg text-muted-foreground">The truth is about to be revealed...</span>
                    <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                  </motion.div>

                  {/* Pulsing ring */}
                  <motion.div
                    className="w-32 h-32 mx-auto rounded-full border-4 border-primary/30"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary))", "hsl(var(--primary) / 0.3)"]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              )}

              {phase === "reveal" && (
                <motion.div
                  key="reveal"
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <Shield className="w-24 h-24 mx-auto text-primary" />
                  </motion.div>
                  <p className="text-2xl font-bold text-primary">Loading Results...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
