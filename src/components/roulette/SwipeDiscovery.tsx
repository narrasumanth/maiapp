import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ThumbsUp, ThumbsDown, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { analyzeReputation } from "@/lib/api/reputation";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DiscoveryCard {
  id: string;
  name: string;
  score: number;
  category: string;
  vibeCheck: string;
  loading?: boolean;
}

const sampleCards: DiscoveryCard[] = [
  { id: "1", name: "OpenAI", score: 88, category: "Company", vibeCheck: "Tech giant building the future" },
  { id: "2", name: "Chipotle", score: 76, category: "Business", vibeCheck: "Fast casual with a loyal following" },
  { id: "3", name: "Steve Jobs", score: 92, category: "Person", vibeCheck: "Visionary tech pioneer" },
];

const getScoreColor = (score: number) => {
  if (score >= 90) return "from-score-diamond to-score-diamond/70";
  if (score >= 75) return "from-score-green to-score-green/70";
  if (score >= 50) return "from-score-yellow to-score-yellow/70";
  return "from-score-red to-score-red/70";
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "💎 Diamond";
  if (score >= 75) return "✅ Trusted";
  if (score >= 50) return "⚠️ Mixed";
  return "🚨 Risky";
};

export const SwipeDiscovery = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cards, setCards] = useState<DiscoveryCard[]>(sampleCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentCard = cards[currentIndex];

  const handleSwipe = useCallback(
    async (swipeDirection: "left" | "right") => {
      if (!currentCard || isLoading) return;

      setDirection(swipeDirection);

      // Brief delay for animation
      setTimeout(() => {
        if (swipeDirection === "right") {
          // User is interested - navigate to full profile
          toast({
            title: "Opening profile...",
            description: `Viewing ${currentCard.name}`,
          });
          
          // Store and navigate
          sessionStorage.setItem(
            "mai-result",
            JSON.stringify({
              name: currentCard.name,
              score: currentCard.score,
              category: currentCard.category,
              vibeCheck: currentCard.vibeCheck,
              evidence: [],
            })
          );
          navigate(`/result?q=${encodeURIComponent(currentCard.name)}`);
        } else {
          // Skip to next card
          if (currentIndex < cards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            toast({
              title: "No more profiles",
              description: "You've seen all available profiles!",
            });
          }
        }
        setDirection(null);
      }, 300);
    },
    [currentCard, currentIndex, cards.length, isLoading, navigate, toast]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      if (info.offset.x > threshold) {
        handleSwipe("right");
      } else if (info.offset.x < -threshold) {
        handleSwipe("left");
      }
    },
    [handleSwipe]
  );

  const resetCards = () => {
    setCurrentIndex(0);
    setDirection(null);
  };

  if (!currentCard) {
    return (
      <GlassCard className="p-8 text-center">
        <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">All caught up!</h3>
        <p className="text-muted-foreground mb-4">
          You've explored all available profiles
        </p>
        <button onClick={resetCards} className="btn-primary px-6 py-2">
          <RotateCcw className="w-4 h-4 mr-2 inline" />
          Start Over
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="relative">
      {/* Instructions */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-1">Swipe to Explore</h3>
        <p className="text-sm text-muted-foreground">
          Swipe right to view profile • Swipe left to skip
        </p>
      </div>

      {/* Card Stack */}
      <div className="relative h-[400px] flex items-center justify-center">
        {/* Background cards for stack effect */}
        {cards.slice(currentIndex + 1, currentIndex + 3).map((card, index) => (
          <div
            key={card.id}
            className="absolute w-full max-w-sm mx-auto"
            style={{
              transform: `scale(${0.95 - index * 0.05}) translateY(${(index + 1) * 10}px)`,
              zIndex: 10 - index,
              opacity: 0.5 - index * 0.2,
            }}
          >
            <GlassCard className="p-6 h-[350px]">
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <div className="w-20 h-20 rounded-full bg-secondary/50" />
              </div>
            </GlassCard>
          </div>
        ))}

        {/* Active Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            className="absolute w-full max-w-sm mx-auto z-20 cursor-grab active:cursor-grabbing touch-none"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
              rotate: direction === "left" ? -15 : direction === "right" ? 15 : 0,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
          >
            <GlassCard className="p-6 h-[350px] relative overflow-hidden">
              {/* Score gradient overlay */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-30 bg-gradient-to-br ${getScoreColor(
                  currentCard.score
                )}`}
              />

              <div className="relative h-full flex flex-col">
                {/* Category Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {currentCard.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentIndex + 1}/{cards.length}
                  </span>
                </div>

                {/* Score */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreColor(
                      currentCard.score
                    )} flex items-center justify-center mb-4`}
                  >
                    <span className="text-3xl font-bold text-primary-foreground">
                      {currentCard.score}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-center mb-2">
                    {currentCard.name}
                  </h2>

                  <span className="text-sm font-medium mb-2">
                    {getScoreLabel(currentCard.score)}
                  </span>

                  <p className="text-sm text-muted-foreground text-center italic">
                    "{currentCard.vibeCheck}"
                  </p>
                </div>

                {/* Swipe hints */}
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-score-red/70">
                    <ThumbsDown className="w-5 h-5" />
                    <span className="text-xs">Skip</span>
                  </div>
                  <div className="flex items-center gap-2 text-score-green/70">
                    <span className="text-xs">View</span>
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons (for desktop/accessibility) */}
      <div className="flex justify-center gap-6 mt-6">
        <motion.button
          onClick={() => handleSwipe("left")}
          disabled={isLoading}
          className="w-14 h-14 rounded-full bg-score-red/20 border border-score-red/30 flex items-center justify-center hover:bg-score-red/30 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ThumbsDown className="w-6 h-6 text-score-red" />
        </motion.button>

        <motion.button
          onClick={() => handleSwipe("right")}
          disabled={isLoading}
          className="w-14 h-14 rounded-full bg-score-green/20 border border-score-green/30 flex items-center justify-center hover:bg-score-green/30 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ThumbsUp className="w-6 h-6 text-score-green" />
        </motion.button>
      </div>
    </div>
  );
};
