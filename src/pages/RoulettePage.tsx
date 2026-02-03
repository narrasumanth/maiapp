import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Dice5, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { analyzeReputation } from "@/lib/api/reputation";
import { useToast } from "@/hooks/use-toast";

interface RouletteItem {
  id: string;
  name: string;
  score: number;
  loading?: boolean;
}

const defaultItems: RouletteItem[] = [
  { id: "1", name: "Sushi Nakazawa", score: 94 },
  { id: "2", name: "Eleven Madison Park", score: 91 },
  { id: "3", name: "Joe's Pizza", score: 78 },
];

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-score-diamond";
  if (score >= 75) return "text-score-green";
  if (score >= 50) return "text-score-yellow";
  return "text-score-red";
};

const RoulettePage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<RouletteItem[]>(defaultItems);
  const [newItemName, setNewItemName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<RouletteItem | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const addItem = useCallback(async () => {
    if (newItemName.trim() && items.length < 8) {
      const tempId = Date.now().toString();
      const itemName = newItemName.trim();
      
      // Add item with loading state
      const newItem: RouletteItem = {
        id: tempId,
        name: itemName,
        score: 50, // Default score while loading
        loading: true,
      };
      
      setItems(prev => [...prev, newItem]);
      setNewItemName("");

      // Fetch real score from AI
      try {
        const response = await analyzeReputation(itemName);
        
        if (response.success && response.data) {
          setItems(prev => prev.map(item => 
            item.id === tempId 
              ? { ...item, score: response.data!.score, loading: false }
              : item
          ));
        } else {
          // Use random score if API fails
          setItems(prev => prev.map(item => 
            item.id === tempId 
              ? { ...item, score: Math.floor(Math.random() * 50) + 50, loading: false }
              : item
          ));
          toast({
            title: "Note",
            description: "Couldn't get AI score, using estimate",
          });
        }
      } catch (error) {
        // Use random score if API fails
        setItems(prev => prev.map(item => 
          item.id === tempId 
            ? { ...item, score: Math.floor(Math.random() * 50) + 50, loading: false }
            : item
        ));
      }
    }
  }, [newItemName, items.length, toast]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const spin = useCallback(() => {
    if (items.length < 2 || isSpinning || items.some(item => item.loading)) return;

    setIsSpinning(true);
    setWinner(null);

    // Calculate weighted probabilities based on scores
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    const random = Math.random() * totalScore;
    
    let cumulative = 0;
    let selectedItem = items[0];
    for (const item of items) {
      cumulative += item.score;
      if (random <= cumulative) {
        selectedItem = item;
        break;
      }
    }

    // Calculate rotation to land on winner
    const itemIndex = items.findIndex(item => item.id === selectedItem.id);
    const segmentAngle = 360 / items.length;
    const targetAngle = segmentAngle * itemIndex + segmentAngle / 2;
    const spins = 5; // Number of full rotations
    const finalRotation = rotation + (spins * 360) + (360 - targetAngle);

    setRotation(finalRotation);

    // Reveal winner after spin
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(selectedItem);
    }, 4000);
  }, [items, isSpinning, rotation]);

  const reset = useCallback(() => {
    setWinner(null);
    setRotation(0);
  }, []);

  const segmentAngle = 360 / items.length;
  const colors = [
    "hsl(217, 91%, 60%)", // blue
    "hsl(270, 91%, 65%)", // purple
    "hsl(185, 100%, 60%)", // cyan
    "hsl(142, 76%, 50%)", // green
    "hsl(45, 100%, 55%)", // yellow
    "hsl(350, 91%, 60%)", // pink
    "hsl(30, 91%, 60%)", // orange
    "hsl(200, 91%, 50%)", // light blue
  ];

  const hasLoadingItems = items.some(item => item.loading);

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Grid Background */}
      <div className="fixed inset-0 grid-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/10 mb-4">
            <Dice5 className="w-4 h-4 text-neon-purple" />
            <span className="text-sm text-muted-foreground">Weighted by AI Reputation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="neon-text">MAI Roulette</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Can't decide? Let the algorithm choose. Higher scores get better odds.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Wheel Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Wheel Container */}
            <div className="relative w-80 h-80 mb-8">
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-neon-gradient blur-3xl opacity-20" />
              
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="relative w-full h-full rounded-full border-4 border-white/20 overflow-hidden transition-transform"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "4s" : "0s",
                  transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)",
                }}
              >
                {items.length > 0 ? (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {items.map((item, index) => {
                      const startAngle = index * segmentAngle - 90;
                      const endAngle = startAngle + segmentAngle;
                      const start = {
                        x: 50 + 50 * Math.cos((startAngle * Math.PI) / 180),
                        y: 50 + 50 * Math.sin((startAngle * Math.PI) / 180),
                      };
                      const end = {
                        x: 50 + 50 * Math.cos((endAngle * Math.PI) / 180),
                        y: 50 + 50 * Math.sin((endAngle * Math.PI) / 180),
                      };
                      const largeArc = segmentAngle > 180 ? 1 : 0;

                      return (
                        <g key={item.id}>
                          <path
                            d={`M 50 50 L ${start.x} ${start.y} A 50 50 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                            fill={colors[index % colors.length]}
                            opacity={item.loading ? 0.5 : 0.8}
                          />
                          <text
                            x={50 + 30 * Math.cos(((startAngle + segmentAngle / 2) * Math.PI) / 180)}
                            y={50 + 30 * Math.sin(((startAngle + segmentAngle / 2) * Math.PI) / 180)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="4"
                            fontWeight="600"
                            transform={`rotate(${startAngle + segmentAngle / 2 + 90}, ${50 + 30 * Math.cos(((startAngle + segmentAngle / 2) * Math.PI) / 180)}, ${50 + 30 * Math.sin(((startAngle + segmentAngle / 2) * Math.PI) / 180)})`}
                          >
                            {item.name.length > 12 ? item.name.slice(0, 12) + "..." : item.name}
                          </text>
                        </g>
                      );
                    })}
                    {/* Center Circle */}
                    <circle cx="50" cy="50" r="10" fill="hsl(222, 47%, 8%)" stroke="white" strokeWidth="0.5" />
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <p className="text-muted-foreground">Add items to spin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Spin Button */}
            <div className="flex gap-4">
              <motion.button
                onClick={spin}
                disabled={items.length < 2 || isSpinning || hasLoadingItems}
                className="btn-neon px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 mr-2 inline" />
                {isSpinning ? "Spinning..." : hasLoadingItems ? "Loading scores..." : "Spin the Wheel"}
              </motion.button>
              {winner && (
                <motion.button
                  onClick={reset}
                  className="btn-glass px-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Winner Announcement */}
            <AnimatePresence>
              {winner && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="mt-8 text-center"
                >
                  <GlassCard variant="glow" className="p-6">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                      The Algorithm Has Spoken
                    </p>
                    <h2 className="text-3xl font-bold neon-text">{winner.name}</h2>
                    <p className={`text-lg font-semibold mt-2 ${getScoreColor(winner.score)}`}>
                      Score: {winner.score}
                    </p>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Items List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Your Options</h2>

              {/* Add Item Form */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Add a restaurant, product..."
                  className="glass-input flex-1 py-3"
                  maxLength={50}
                />
                <button
                  onClick={addItem}
                  disabled={!newItemName.trim() || items.length >= 8}
                  className="btn-neon px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5"
                    >
                      {/* Color Indicator */}
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      
                      {/* Name */}
                      <span className="flex-1 font-medium">{item.name}</span>
                      
                      {/* Score */}
                      {item.loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <span className={`font-semibold ${getScoreColor(item.score)}`}>
                          {item.score}
                        </span>
                      )}
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Probability Note */}
              {items.length >= 2 && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Higher AI scores = higher chance of being selected
                </p>
              )}

              {items.length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Add at least 2 options to spin
                </p>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoulettePage;
