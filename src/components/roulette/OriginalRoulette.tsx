import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, RotateCcw, Loader2 } from "lucide-react";
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

export const OriginalRoulette = () => {
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
      
      const newItem: RouletteItem = {
        id: tempId,
        name: itemName,
        score: 50,
        loading: true,
      };
      
      setItems(prev => [...prev, newItem]);
      setNewItemName("");

      try {
        const response = await analyzeReputation(itemName);
        
        if (response.success && response.data) {
          setItems(prev => prev.map(item => 
            item.id === tempId 
              ? { ...item, score: response.data!.score, loading: false }
              : item
          ));
        } else {
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

    const itemIndex = items.findIndex(item => item.id === selectedItem.id);
    const segmentAngle = 360 / items.length;
    const targetAngle = segmentAngle * itemIndex + segmentAngle / 2;
    const spins = 5;
    const finalRotation = rotation + (spins * 360) + (360 - targetAngle);

    setRotation(finalRotation);

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
    "hsl(217, 91%, 60%)",
    "hsl(270, 91%, 65%)",
    "hsl(185, 100%, 60%)",
    "hsl(142, 76%, 50%)",
    "hsl(45, 100%, 55%)",
    "hsl(350, 91%, 60%)",
    "hsl(30, 91%, 60%)",
    "hsl(200, 91%, 50%)",
  ];

  const hasLoadingItems = items.some(item => item.loading);

  return (
    <GlassCard className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Decision Wheel</h2>
        <p className="text-muted-foreground text-sm">
          Can't decide? Let the algorithm choose. Higher scores = better odds.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Wheel Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6">
            <div className="absolute inset-0 rounded-full bg-neon-gradient blur-3xl opacity-20" />
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>

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
                          x={50 + 28 * Math.cos(((startAngle + segmentAngle / 2) * Math.PI) / 180)}
                          y={50 + 28 * Math.sin(((startAngle + segmentAngle / 2) * Math.PI) / 180)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="3.5"
                          fontWeight="600"
                          transform={`rotate(${startAngle + segmentAngle / 2 + 90}, ${50 + 28 * Math.cos(((startAngle + segmentAngle / 2) * Math.PI) / 180)}, ${50 + 28 * Math.sin(((startAngle + segmentAngle / 2) * Math.PI) / 180)})`}
                        >
                          {item.name.length > 10 ? item.name.slice(0, 10) + "..." : item.name}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="50" cy="50" r="8" fill="hsl(222, 47%, 8%)" stroke="white" strokeWidth="0.5" />
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                  <p className="text-muted-foreground text-sm">Add items</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={spin}
              disabled={items.length < 2 || isSpinning || hasLoadingItems}
              className="btn-neon px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4 mr-2 inline" />
              {isSpinning ? "Spinning..." : hasLoadingItems ? "Loading..." : "Spin"}
            </motion.button>
            {winner && (
              <motion.button
                onClick={reset}
                className="btn-glass px-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center"
              >
                <p className="text-sm text-muted-foreground mb-1">Winner:</p>
                <h3 className="text-xl font-bold neon-text">{winner.name}</h3>
                <p className={`font-semibold ${getScoreColor(winner.score)}`}>
                  Score: {winner.score}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Items List */}
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Add option..."
              className="glass-input flex-1 py-2 text-sm"
              maxLength={50}
            />
            <button
              onClick={addItem}
              disabled={!newItemName.trim() || items.length >= 8}
              className="btn-neon px-3 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  layout
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-white/5"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="flex-1 font-medium text-sm truncate">{item.name}</span>
                  {item.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className={`font-semibold text-sm ${getScoreColor(item.score)}`}>
                      {item.score}
                    </span>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {items.length >= 2 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Higher scores = higher chance of winning
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
