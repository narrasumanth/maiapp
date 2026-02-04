import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MapPin, Shield, Flame } from "lucide-react";

interface TickerItem {
  icon: "up" | "down" | "verified" | "hot";
  text: string;
}

const tickerItems: TickerItem[] = [
  { icon: "hot", text: "Elon Musk pulse dropped -2%" },
  { icon: "up", text: "OpenAI pulse rising +5%" },
  { icon: "verified", text: "Noma Restaurant pulse verified" },
  { icon: "down", text: "FTX pulse critical: 12" },
  { icon: "up", text: "Taylor Swift +8% this week" },
  { icon: "hot", text: "ChatGPT pulse trending #1" },
  { icon: "verified", text: "Tesla pulse stabilizing" },
  { icon: "down", text: "Meta pulse fluctuating" },
];

const getIcon = (type: TickerItem["icon"]) => {
  switch (type) {
    case "up":
      return <TrendingUp className="w-3 h-3 text-score-green" />;
    case "down":
      return <TrendingDown className="w-3 h-3 text-score-red" />;
    case "verified":
      return <MapPin className="w-3 h-3 text-neon-cyan" />;
    case "hot":
      return <Flame className="w-3 h-3 text-orange-400" />;
  }
};

export const LiveTicker = () => {
  // Duplicate items for seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-white/5 overflow-hidden">
      <motion.div
        className="flex items-center gap-8 py-2 whitespace-nowrap"
        animate={{ x: [0, -50 * tickerItems.length] }}
        transition={{
          x: {
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {getIcon(item.icon)}
            <span className="text-muted-foreground">{item.text}</span>
            <span className="text-white/20">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
