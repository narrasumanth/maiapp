import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Loader2 } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <motion.div
        className="relative"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Focus ring */}
        <motion.div
          className="absolute -inset-0.5 rounded-xl bg-primary/50 opacity-0 blur-sm"
          animate={{ opacity: isFocused ? 0.5 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Main input container */}
        <div className={cn(
          "relative flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200",
          "bg-secondary border",
          isFocused ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border"
        )}>
          {/* Search icon */}
          <Search className={cn(
            "w-5 h-5 shrink-0 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} />

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
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={isLoading}
          />

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
              "bg-primary text-primary-foreground",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:bg-primary/90"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </form>
  );
};
