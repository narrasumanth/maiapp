import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Link2, User, MapPin, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchBar = ({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Search any person, place, or product...",
  className 
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const isUrl = query.startsWith("http://") || query.startsWith("https://") || query.includes(".com");

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-3xl mx-auto", className)}>
      <motion.div
        className="relative"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-neon-gradient opacity-0 blur-xl transition-opacity duration-300"
          animate={{ opacity: isFocused ? 0.3 : 0 }}
        />

        {/* Input Container */}
        <div className={cn(
          "relative flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-300",
          "bg-secondary/60 backdrop-blur-xl",
          "border border-white/10",
          isFocused && "border-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
        )}>
          {/* Icon */}
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
          >
            {isUrl ? (
              <Link2 className="w-6 h-6 text-neon-cyan" />
            ) : (
              <Search className="w-6 h-6 text-muted-foreground" />
            )}
          </motion.div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={isLoading}
          />

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
              "bg-neon-gradient text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Get MAI Score</span>
          </motion.button>
        </div>

        {/* Quick Filters */}
        <motion.div 
          className="flex items-center justify-center gap-4 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { icon: User, label: "Person" },
            { icon: MapPin, label: "Place" },
            { icon: Package, label: "Product" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setQuery(label === "Person" ? "Elon Musk" : label === "Place" ? "Starbucks" : "iPhone")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </motion.div>
      </motion.div>
    </form>
  );
};
