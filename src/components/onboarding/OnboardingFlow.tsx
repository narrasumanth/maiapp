import { useState } from "react";
import { Search, Shuffle, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

type IntentType = "check" | "pick" | "build";

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const intentOptions = [
  {
    id: "check" as IntentType,
    icon: Search,
    title: "Check someone",
    description: "Look up trust scores",
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "pick" as IntentType,
    icon: Shuffle,
    title: "Run a fair pick",
    description: "Random selection for groups",
    gradient: "from-purple-500/20 to-pink-500/10",
  },
  {
    id: "build" as IntentType,
    icon: Shield,
    title: "Build my reputation",
    description: "Claim & grow your profile",
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
];

export const OnboardingFlow = ({ onComplete, onSkip }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const [selectedIntent, setSelectedIntent] = useState<IntentType | null>(null);
  const isMobile = useIsMobile();

  const handleSelect = (intent: IntentType) => {
    setSelectedIntent(intent);
    
    // Brief delay for visual feedback then complete
    setTimeout(() => {
      onComplete();
      if (intent === "pick") {
        navigate("/impulse");
      }
      // For "check" and "build", stay on homepage to search
    }, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/95 ${isMobile ? '' : 'backdrop-blur-xl'}`}>
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">What brings you here?</h2>
          <p className="text-muted-foreground">
            Pick one to get started
          </p>
        </div>

        <div className="space-y-3">
          {intentOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selectedIntent === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                }`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{option.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      ✓
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          No account needed to explore
        </p>
      </div>
    </div>
  );
};
