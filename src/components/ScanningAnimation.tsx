import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  MessageSquare, 
  Star, 
  Newspaper, 
  Twitter, 
  Instagram,
  CheckCircle2
} from "lucide-react";
import { useEffect, useState } from "react";

const scanSteps = [
  { icon: Globe, text: "Searching Google...", delay: 0 },
  { icon: Star, text: "Checking Google Maps...", delay: 0.5 },
  { icon: MessageSquare, text: "Scanning Reddit...", delay: 1 },
  { icon: Twitter, text: "Analyzing Twitter...", delay: 1.5 },
  { icon: Instagram, text: "Checking Instagram...", delay: 2 },
  { icon: Newspaper, text: "Scanning Recent News...", delay: 2.5 },
];

interface ScanningAnimationProps {
  isScanning: boolean;
  onComplete?: () => void;
}

export const ScanningAnimation = ({ isScanning, onComplete }: ScanningAnimationProps) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isScanning) {
      setCompletedSteps([]);
      setCurrentStep(0);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    
    scanSteps.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        if (index > 0) {
          setCompletedSteps(prev => [...prev, index - 1]);
        }
      }, (scanSteps[index].delay + 0.3) * 1000);
      timers.push(timer);
    });

    // Complete all and trigger callback
    const completeTimer = setTimeout(() => {
      setCompletedSteps(scanSteps.map((_, i) => i));
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 3500);
    timers.push(completeTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [isScanning, onComplete]);

  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card-glow p-8 w-full max-w-md mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-gradient mb-4"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(59,130,246,0.4)",
                  "0 0 40px rgba(139,92,246,0.4)",
                  "0 0 20px rgba(59,130,246,0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Globe className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold neon-text">Scanning Digital Footprint</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Analyzing reputation across the web...
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {scanSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index && !isCompleted;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrent ? "bg-primary/10 border border-primary/20" : 
                    isCompleted ? "bg-score-green/10" : "bg-secondary/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-score-green/20" : 
                    isCurrent ? "bg-primary/20" : "bg-secondary/50"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-score-green" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isCompleted ? "text-score-green" : 
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.text}
                  </span>
                  {isCurrent && (
                    <motion.div
                      className="ml-auto flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-neon-gradient"
                initial={{ width: "0%" }}
                animate={{ width: `${((completedSteps.length + 1) / scanSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
