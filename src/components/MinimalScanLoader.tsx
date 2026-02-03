import { motion } from "framer-motion";
import { Globe, Search, Shield, Sparkles } from "lucide-react";

interface MinimalScanLoaderProps {
  searchQuery: string;
}

export const MinimalScanLoader = ({ searchQuery }: MinimalScanLoaderProps) => {
  const sources = ["Google", "Reddit", "Twitter", "LinkedIn", "News", "Reviews"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-card-glow p-8 text-center">
        {/* Animated icon */}
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          animate={{ 
            rotate: 360,
            boxShadow: [
              "0 0 30px rgba(59,130,246,0.3)",
              "0 0 50px rgba(139,92,246,0.4)",
              "0 0 30px rgba(59,130,246,0.3)"
            ]
          }}
          transition={{ 
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            boxShadow: { duration: 2, repeat: Infinity }
          }}
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>

        {/* Query */}
        <h3 className="text-xl font-bold mb-2">
          Analyzing <span className="neon-text">{searchQuery}</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Gathering intelligence from across the web...
        </p>

        {/* Animated source pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {sources.map((source, i) => (
            <motion.span
              key={source}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
              transition={{ 
                opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.2 },
                scale: { delay: i * 0.1 }
              }}
              className="px-3 py-1.5 text-xs rounded-full bg-secondary/50 text-muted-foreground"
            >
              {source}
            </motion.span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            initial={{ width: "0%", x: "-100%" }}
            animate={{ width: "100%", x: "0%" }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        </div>

        <motion.p 
          className="mt-4 text-xs text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          This usually takes 3-5 seconds...
        </motion.p>
      </div>
    </motion.div>
  );
};
