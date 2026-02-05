import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, User, Building, ArrowRight, Sparkles, Plus, X, Film, Music, Utensils, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DisambiguationOption } from "@/lib/api/reputation";

interface MatchingEntriesProps {
  query: string;
  options: DisambiguationOption[];
  onSelect: (option: DisambiguationOption) => void;
  onBack: () => void;
  clarifyingQuestion?: string;
}

export const MatchingEntries = ({
  query,
  options,
  onSelect,
  onBack,
  clarifyingQuestion,
}: MatchingEntriesProps) => {
  const [showContextInput, setShowContextInput] = useState(false);
  const [contextValue, setContextValue] = useState("");

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "place":
      case "restaurant":
        return MapPin;
      case "store":
      case "product":
        return Package;
      case "person":
        return User;
      case "company":
      case "brand":
      case "business":
        return Building;
      case "movie":
      case "show":
        return Film;
      case "song":
      case "music":
        return Music;
      case "food":
        return Utensils;
      default:
        return Sparkles;
    }
  };

  const getContextPlaceholder = () => {
    const categories = options.map(o => o.category.toLowerCase());
    if (categories.some(c => ["restaurant", "place", "store"].includes(c))) {
      return "e.g., New York, Downtown LA, Miami Beach...";
    }
    if (categories.some(c => ["person"].includes(c))) {
      return "e.g., Actor, CEO, from California...";
    }
    if (categories.some(c => ["movie", "show"].includes(c))) {
      return "e.g., 2021, English, directed by Nolan...";
    }
    if (categories.some(c => ["song", "music"].includes(c))) {
      return "e.g., by Taylor Swift, 2023 release...";
    }
    return "e.g., location, year, creator, language...";
  };

  const handleContextSearch = () => {
    if (contextValue.trim()) {
      // Create a new search option with the added context
      const enrichedOption: DisambiguationOption = {
        id: `context-${Date.now()}`,
        name: `${query} (${contextValue.trim()})`,
        category: "New Search",
        description: `Searching for "${query}" with context: ${contextValue.trim()}`,
      };
      onSelect(enrichedOption);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Multiple matches found</span>
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2">
          Which <span className="neon-text">{query}</span>?
        </h2>
        
        {clarifyingQuestion && (
          <p className="text-muted-foreground">{clarifyingQuestion}</p>
        )}
      </div>

      {/* Context Input Section */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mb-4"
      >
        {!showContextInput ? (
          <button
            onClick={() => setShowContextInput(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add context to narrow results
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Add more context</p>
              <button
                onClick={() => {
                  setShowContextInput(false);
                  setContextValue("");
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Help us find exactly what you're looking for
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={contextValue}
                onChange={(e) => setContextValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContextSearch()}
                placeholder={getContextPlaceholder()}
                className="flex-1 bg-background/50 border-border/50 text-sm"
                autoFocus
              />
              <button
                onClick={handleContextSearch}
                disabled={!contextValue.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Options Grid */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const Icon = getCategoryIcon(option.category);
          const isNewSearch = option.id === "new";
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(option)}
              className={`w-full group p-4 rounded-xl text-left transition-all duration-200 ${
                isNewSearch 
                  ? "bg-secondary/30 border border-dashed border-white/20 hover:border-primary/40"
                  : "glass-card-hover"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isNewSearch ? "bg-primary/10" : "bg-gradient-to-br from-primary/20 to-accent/20"
                }`}>
                  <Icon className={`w-5 h-5 ${isNewSearch ? "text-primary" : "text-foreground"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{option.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground shrink-0">
                      {option.category}
                    </span>
                  </div>
                  
                  {option.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {option.description}
                    </p>
                  )}

                  {/* Metadata badges */}
                  {option.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {option.metadata.distinguisher && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3" />
                          {option.metadata.distinguisher}
                        </span>
                      )}
                      {option.metadata.year && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          {option.metadata.year}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={onBack}
        className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        ← Search for something else
      </motion.button>
    </motion.div>
  );
};
