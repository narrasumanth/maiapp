import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, User, Building, ArrowRight, Sparkles, Plus, X, Film, Music, Utensils, Package, Search, Tag, Globe, Star, Briefcase, Award } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DisambiguationOption } from "@/lib/api/reputation";

interface MatchingEntriesProps {
  query: string;
  options: DisambiguationOption[];
  onSelect: (option: DisambiguationOption) => void;
  onBack: () => void;
  clarifyingQuestion?: string;
  onSearchWithContext?: (query: string, context: string) => void;
}

export const MatchingEntries = ({
  query,
  options,
  onSelect,
  onBack,
  clarifyingQuestion,
  onSearchWithContext,
}: MatchingEntriesProps) => {
  const [showContextInput, setShowContextInput] = useState(false);
  const [contextValue, setContextValue] = useState("");

  // Extract ALL available characteristics from option for display
  const getKeyCharacteristics = (option: DisambiguationOption) => {
    const characteristics: { icon: typeof MapPin; label: string; value: string }[] = [];
    
    // Add location if available
    if (option.location) {
      characteristics.push({ icon: MapPin, label: "Location", value: option.location });
    }
    
    // Add year if available
    if (option.metadata?.year) {
      characteristics.push({ icon: Calendar, label: "Year", value: String(option.metadata.year) });
    }
    
    // Add creator if available
    if (option.metadata?.creator) {
      characteristics.push({ icon: Star, label: "By", value: option.metadata.creator });
    }
    
    // Add distinguisher if available
    if (option.metadata?.distinguisher) {
      characteristics.push({ icon: Award, label: "Known for", value: option.metadata.distinguisher });
    }
    
    return characteristics;
  };

  // Generate a subtitle based on available data for better differentiation
  const getSubtitle = (option: DisambiguationOption) => {
    const parts: string[] = [];
    
    if (option.location) parts.push(option.location);
    if (option.metadata?.year) parts.push(String(option.metadata.year));
    if (option.metadata?.creator) parts.push(`by ${option.metadata.creator}`);
    if (option.metadata?.distinguisher) parts.push(option.metadata.distinguisher);
    
    return parts.length > 0 ? parts.join(" • ") : null;
  };

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

  const getContextHints = () => {
    const categories = options.map(o => o.category.toLowerCase());
    if (categories.some(c => ["restaurant", "place", "store"].includes(c))) {
      return ["City or neighborhood", "Street name", "Near a landmark"];
    }
    if (categories.some(c => ["person"].includes(c))) {
      return ["Profession or job title", "Company they work at", "City they live in"];
    }
    if (categories.some(c => ["movie", "show"].includes(c))) {
      return ["Release year", "Director name", "Language or country"];
    }
    if (categories.some(c => ["song", "music"].includes(c))) {
      return ["Artist or band", "Album name", "Release year"];
    }
    return ["Location", "Year", "Related names"];
  };

  const handleContextSearch = () => {
    if (contextValue.trim()) {
      if (onSearchWithContext) {
        // Trigger a new search with the added context
        onSearchWithContext(query, contextValue.trim());
      } else {
        // Fallback: Create a new search option with the added context
        const enrichedOption: DisambiguationOption = {
          id: `context-${Date.now()}`,
          name: `${query} (${contextValue.trim()})`,
          category: "New Search",
          description: `Searching for "${query}" with context: ${contextValue.trim()}`,
        };
        onSelect(enrichedOption);
      }
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
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Not finding the right one? Add more details
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Refine your search</p>
              </div>
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
            
            <p className="text-sm text-muted-foreground">
              Type anything you know about this {query} — the more details, the better match:
            </p>
            
            {/* Hint chips */}
            <div className="flex flex-wrap gap-1.5">
              {getContextHints().map((hint, i) => (
                <button
                  key={i}
                  onClick={() => setContextValue(prev => prev ? `${prev}, ${hint.toLowerCase()}` : hint.toLowerCase())}
                  className="px-2.5 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  + {hint}
                </button>
              ))}
            </div>
            
            <div className="space-y-2">
              <Textarea
                value={contextValue}
                onChange={(e) => setContextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleContextSearch();
                  }
                }}
                placeholder={`${getContextPlaceholder()}\n\nYou can add multiple details, separated by commas or on new lines.`}
                className="min-h-[80px] bg-background/50 border-border/50 text-sm resize-none"
                autoFocus
              />
              <button
                onClick={handleContextSearch}
                disabled={!contextValue.trim()}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search with these details
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
          const characteristics = getKeyCharacteristics(option);
          const subtitle = getSubtitle(option);

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
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  isNewSearch ? "bg-primary/10" : "bg-gradient-to-br from-primary/10 to-accent/10"
                }`}>
                  <Icon className={`w-6 h-6 ${isNewSearch ? "text-primary" : "text-foreground"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{option.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-primary/10 text-primary font-medium">
                      {option.category}
                    </span>
                  </div>
                  
                  {/* Subtitle with key differentiating info */}
                  {subtitle && (
                    <p className="text-sm text-primary/80 font-medium mb-1.5">
                      {subtitle}
                    </p>
                  )}
                  
                  {option.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {option.description}
                    </p>
                  )}

                  {/* Detailed characteristics badges */}
                  {!isNewSearch && characteristics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {characteristics.map((char, i) => (
                        <span 
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs text-foreground/80 bg-secondary/70 px-2.5 py-1 rounded-lg border border-border/50"
                        >
                          <char.icon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-muted-foreground">{char.label}:</span>
                          <span className="font-medium">{char.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-3" />
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
