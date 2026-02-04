import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shuffle, Shield, ArrowRight, Play, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScoreGauge } from "@/components/ScoreGauge";

type IntentType = "check" | "pick" | "build" | null;

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingFlow = ({ onComplete, onSkip }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intent, setIntent] = useState<IntentType>(null);
  const [demoScore, setDemoScore] = useState(0);
  const [showDemoComplete, setShowDemoComplete] = useState(false);

  // Demo animation for step 2
  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(() => {
        setDemoScore((prev) => {
          if (prev >= 78) {
            clearInterval(interval);
            setTimeout(() => setShowDemoComplete(true), 500);
            return 78;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleIntentSelect = (selectedIntent: IntentType) => {
    setIntent(selectedIntent);
    setStep(2);
  };

  const handleFirstAction = () => {
    onComplete();
    if (intent === "pick") {
      navigate("/impulse");
    }
    // For "check" and "build", stay on homepage to search
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-lg mx-4">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step ? "w-8 bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Intent Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Why are you here?
              </h2>
              <p className="text-muted-foreground mb-8">
                Tell us what you're looking to do
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleIntentSelect("check")}
                  className="w-full p-5 rounded-2xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Check someone</p>
                      <p className="text-sm text-muted-foreground">
                        Verify trust before you engage
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleIntentSelect("pick")}
                  className="w-full p-5 rounded-2xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Shuffle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Run a fair pick</p>
                      <p className="text-sm text-muted-foreground">
                        Provably random selection for groups
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleIntentSelect("build")}
                  className="w-full p-5 rounded-2xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Build trust</p>
                      <p className="text-sm text-muted-foreground">
                        Claim and grow your reputation
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={onSkip}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* Step 2: Demo Animation */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                See it in action
              </h2>
              <p className="text-muted-foreground mb-8">
                Watch how we analyze trust in seconds
              </p>

              <div className="relative py-8">
                {/* Demo Score Display */}
                <div className="flex justify-center mb-6">
                  <ScoreGauge score={demoScore} size="md" animated={false} />
                </div>

                {/* Scanning text */}
                {!showDemoComplete && (
                  <motion.div
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Analyzing web presence...
                  </motion.div>
                )}

                {/* Demo complete */}
                {showDemoComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-lg font-semibold text-score-green">
                      Trusted Profile
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Strong community reputation with verified proof
                    </p>
                  </motion.div>
                )}
              </div>

              {showDemoComplete && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setStep(3)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Step 3: First Action */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                You're ready!
              </h2>
              <p className="text-muted-foreground mb-8">
                {intent === "check" && "Search anyone to see their trust score"}
                {intent === "pick" && "Create your first fair selection"}
                {intent === "build" && "Search yourself to claim your profile"}
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleFirstAction}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  {intent === "check" && (
                    <>
                      <Search className="w-5 h-5" />
                      Scan Now
                    </>
                  )}
                  {intent === "pick" && (
                    <>
                      <Shuffle className="w-5 h-5" />
                      Create Fair Pick
                    </>
                  )}
                  {intent === "build" && (
                    <>
                      <Shield className="w-5 h-5" />
                      Find My Profile
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground">
                  No signup required to explore
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
