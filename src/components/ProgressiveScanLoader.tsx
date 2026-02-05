import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScanStep {
  id: string;
  label: string;
  source: string;
}

const scanSteps: ScanStep[] = [
  { id: "google", label: "Scanning Google results", source: "Google" },
  { id: "reddit", label: "Analyzing Reddit sentiment", source: "Reddit" },
  { id: "twitter", label: "Checking Twitter mentions", source: "Twitter" },
  { id: "linkedin", label: "Reviewing LinkedIn profiles", source: "LinkedIn" },
  { id: "news", label: "Scanning news outlets", source: "News" },
  { id: "reviews", label: "Aggregating review sites", source: "Reviews" },
  { id: "analysis", label: "Running AI sentiment analysis", source: "AI" },
  { id: "calculating", label: "Calculating trust score", source: "Score" },
];

interface ProgressiveScanLoaderProps {
  searchQuery: string;
}

export const ProgressiveScanLoader = ({ searchQuery }: ProgressiveScanLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Faster step advancement on mobile for snappier feel
    const stepDurations = isMobile 
      ? [200, 250, 200, 200, 250, 250, 300, 200]
      : [400, 500, 450, 400, 550, 500, 600, 400];
    let totalDelay = 0;

    const timeouts: NodeJS.Timeout[] = [];
    
    scanSteps.forEach((step, index) => {
      totalDelay += stepDurations[index] || 500;

      const timeout = setTimeout(() => {
        setCurrentStep(index + 1);
        setCompletedSteps((prev) => [...prev, step.id]);
      }, totalDelay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(t => clearTimeout(t));
      setCurrentStep(0);
      setCompletedSteps([]);
    };
  }, [searchQuery, isMobile]);

  const progress = (currentStep / scanSteps.length) * 100;

  // Simplified mobile version - no heavy animations
  if (isMobile) {
    return (
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="glass-card p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              Analyzing <span className="neon-text">{searchQuery}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Scanning web sources...
            </p>
          </div>

          {/* Simple progress bar without motion */}
          <div className="space-y-2">
            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glass-card-glow p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 20px hsl(180 60% 48% / 0.3)",
                "0 0 40px hsl(180 60% 48% / 0.5)",
                "0 0 20px hsl(180 60% 48% / 0.3)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Shield className="w-8 h-8 text-primary-foreground" />
          </motion.div>

          <h3 className="text-xl font-bold mb-1">
            Analyzing <span className="neon-text">{searchQuery}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Gathering intelligence from across the web
          </p>
        </div>

        {/* Live Feed */}
        <div className="space-y-2 mb-6 max-h-48 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {scanSteps.slice(0, currentStep + 1).map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStep && !isCompleted;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/30"
                      : isCompleted
                      ? "bg-secondary/30"
                      : "bg-secondary/20"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-score-green/20 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-score-green" />
                      </motion.div>
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>

                  <span
                    className={`text-sm flex-1 ${
                      isCurrent
                        ? "text-foreground font-medium"
                        : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {step.label}
                  </span>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    {step.source}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <motion.p
          className="mt-4 text-xs text-muted-foreground text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          This usually takes 3-5 seconds...
        </motion.p>
      </div>
    </motion.div>
  );
};
