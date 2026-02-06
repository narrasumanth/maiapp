import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  MessageSquare, 
  Star, 
  Newspaper, 
  Twitter, 
  Instagram,
  CheckCircle2,
  Linkedin,
  MapPin,
  ShoppingBag
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const scanSteps = [
  { icon: Globe, text: "Searching Google...", source: "google.com" },
  { icon: MapPin, text: "Checking Google Maps...", source: "maps.google.com" },
  { icon: MessageSquare, text: "Scanning Reddit...", source: "reddit.com" },
  { icon: Twitter, text: "Analyzing Twitter...", source: "twitter.com" },
  { icon: Instagram, text: "Checking Instagram...", source: "instagram.com" },
  { icon: Linkedin, text: "Scanning LinkedIn...", source: "linkedin.com" },
  { icon: ShoppingBag, text: "Checking Reviews...", source: "trustpilot.com" },
  { icon: Newspaper, text: "Scanning News...", source: "news sources" },
];

interface ScanningAnimationProps {
  isScanning: boolean;
  searchQuery?: string;
  onComplete?: () => void;
}

export const ScanningAnimation = ({ isScanning, searchQuery, onComplete }: ScanningAnimationProps) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [dataPoints, setDataPoints] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [sourcesChecked, setSourcesChecked] = useState(0);
  const animationFrame = useRef<number>();
  const startTime = useRef<number>(0);
  const isMobile = useIsMobile();

  // Reset state when scanning starts/stops
  useEffect(() => {
    if (!isScanning) {
      setCompletedSteps([]);
      setCurrentStep(0);
      setCountdown(5);
      setDataPoints(0);
      setAccuracyRate(0);
      setSourcesChecked(0);
      return;
    }

    startTime.current = Date.now();
    const stepDuration = isMobile ? 350 : 500; // Faster on mobile
    const timers: NodeJS.Timeout[] = [];
    
    // Animate through steps
    scanSteps.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        setSourcesChecked(index + 1);
        if (index > 0) {
          setCompletedSteps(prev => [...prev, index - 1]);
        }
      }, index * stepDuration);
      timers.push(timer);
    });

    // Countdown timer - actually counts down
    const countdownInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      const remaining = Math.max(0, 5 - elapsed);
      setCountdown(remaining);
    }, 100);

    // Data points counter animation - less frequent updates on mobile
    let points = 0;
    const maxPoints = 800 + Math.floor(Math.random() * 800);
    const updateInterval = isMobile ? 100 : 50; // Slower updates on mobile
    
    const incrementDataPoints = () => {
      const increment = Math.floor(Math.random() * 40) + 15;
      points = Math.min(points + increment, maxPoints);
      setDataPoints(points);
      
      const baseAccuracy = 92 + Math.random() * 7;
      setAccuracyRate(parseFloat(baseAccuracy.toFixed(1)));
    };
    
    const dataInterval = setInterval(incrementDataPoints, updateInterval);

    // Complete all and trigger callback immediately at 100%
    const completeTimer = setTimeout(() => {
      setCompletedSteps(scanSteps.map((_, i) => i));
      setCountdown(0);
      setSourcesChecked(scanSteps.length);
      onComplete?.();
    }, scanSteps.length * stepDuration + 200);
    timers.push(completeTimer);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(countdownInterval);
      clearInterval(dataInterval);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isScanning, onComplete, isMobile]);

  const progress = ((completedSteps.length + 1) / scanSteps.length) * 100;

  // Mobile-optimized version - no heavy animations
  if (isMobile) {
    return (
      <AnimatePresence>
        {isScanning && (
          <div className="w-full max-w-lg mx-auto">
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-3">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">
                    Analyzing <span className="text-primary">{searchQuery || "Entity"}</span>
                  </h3>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <div className="text-xl font-bold text-primary">{dataPoints.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Data</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <div className="text-xl font-bold text-accent">{sourcesChecked}/{scanSteps.length}</div>
                    <div className="text-xs text-muted-foreground">Sources</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <div className="text-xl font-bold text-score-green">{countdown}s</div>
                    <div className="text-xs text-muted-foreground">ETA</div>
                  </div>
                </div>

                {/* Current Step */}
                <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = scanSteps[currentStep]?.icon || Globe;
                      return <Icon className="w-4 h-4 text-primary" />;
                    })()}
                    <span className="text-sm">{scanSteps[currentStep]?.text || "Analyzing..."}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Analyzing...</span>
                    <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop version with full animations
  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg mx-auto"
        >
          {/* Main Card */}
          <div className="glass-card-glow p-8 relative overflow-hidden">
            {/* Animated Background Pulse */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            <div className="relative z-10">
              {/* Header with Query */}
              <div className="text-center mb-6">
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-4"
                  animate={{ 
                    boxShadow: [
                      "0 0 30px rgba(59,130,246,0.4)",
                      "0 0 60px rgba(139,92,246,0.6)",
                      "0 0 30px rgba(59,130,246,0.4)"
                    ],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity },
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <Globe className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-xl font-bold mb-1">
                  Analyzing <span className="neon-text">{searchQuery || "Entity"}</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Scanning digital footprint across the web...
                </p>
              </div>

              {/* Live Stats Row - Dynamic Values */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-xl bg-secondary/30">
                  <motion.div 
                    className="text-2xl font-bold text-primary"
                    key={dataPoints}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {dataPoints.toLocaleString()}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Data Points</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/30">
                  <motion.div 
                    className="text-2xl font-bold text-accent"
                    key={sourcesChecked}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    {sourcesChecked}/{scanSteps.length}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">Sources</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/30">
                  <motion.div 
                    className="text-2xl font-bold text-score-green"
                    key={countdown}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {countdown}s
                  </motion.div>
                  <div className="text-xs text-muted-foreground">ETA</div>
                </div>
              </div>

              {/* Accuracy Rate - Dynamic */}
              <div className="text-center mb-4 p-2 rounded-lg bg-score-green/10">
                <span className="text-sm text-muted-foreground">Analysis Accuracy: </span>
                <motion.span 
                  className="font-bold text-score-green"
                  key={accuracyRate}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                >
                  {accuracyRate > 0 ? `${accuracyRate}%` : "Calculating..."}
                </motion.span>
              </div>

              {/* Scanning Steps - Compact List */}
              <div className="space-y-2 mb-6 max-h-48 overflow-hidden">
                {scanSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = completedSteps.includes(index);
                  const isCurrent = currentStep === index && !isCompleted;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: index <= currentStep ? 1 : 0.3, 
                        x: 0 
                      }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                        isCurrent ? "bg-primary/10 border border-primary/30" : 
                        isCompleted ? "bg-score-green/5" : "bg-secondary/20"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted ? "bg-score-green/20" : 
                        isCurrent ? "bg-primary/20" : "bg-secondary/30"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-score-green" />
                        ) : (
                          <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm truncate block ${
                          isCompleted ? "text-score-green" : 
                          isCurrent ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.text}
                        </span>
                      </div>

                      {isCurrent && (
                        <motion.div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Analyzing...</span>
                  <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
