import { motion } from "framer-motion";
import { MapPin, Calendar, User, Building, ArrowRight, Sparkles } from "lucide-react";
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
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "place":
      case "restaurant":
      case "store":
        return MapPin;
      case "person":
        return User;
      case "company":
      case "brand":
        return Building;
      default:
        return Sparkles;
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
