import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypedPlaceholder } from "./TypedPlaceholder";

interface HeroSearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const HeroSearchBar = ({ onSearch, isLoading = false }: HeroSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const placeholder = useTypedPlaceholder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Background dim effect when focused */}
      <motion.div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFocused ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer glow */}
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary opacity-0 blur-xl"
          animate={{ opacity: isFocused ? 0.4 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Inner glow ring */}
        <motion.div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-purple-500"
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Main input container */}
        <div className={cn(
          "relative flex items-center gap-3 rounded-2xl px-5 py-4 transition-all duration-300",
          "bg-secondary/80 backdrop-blur-xl",
          !isFocused && "border border-white/10"
        )}>
          {/* Animated search icon */}
          <motion.div
            animate={{ 
              rotate: isLoading ? 360 : 0,
              scale: isFocused ? 1.1 : 1
            }}
            transition={{ 
              rotate: { duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" },
              scale: { duration: 0.2 }
            }}
          >
            <Search className={cn(
              "w-6 h-6 transition-colors",
              isFocused ? "text-primary" : "text-muted-foreground"
            )} />
          </motion.div>

          {/* Input field */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim() && !isLoading) {
                e.preventDefault();
                onSearch(query.trim());
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={isLoading}
          />

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all",
              "bg-gradient-to-r from-primary to-purple-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Get Score</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Entity type hints */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {["Person", "Restaurant", "Movie", "Artist", "Place", "Product"].map((type) => (
          <span
            key={type}
            className="px-3 py-1 text-xs text-muted-foreground bg-secondary/40 rounded-full"
          >
            {type}
          </span>
        ))}
      </motion.div>
    </form>
  );
};
