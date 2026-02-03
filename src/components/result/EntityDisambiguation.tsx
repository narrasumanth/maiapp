import { motion } from "framer-motion";
import { User, MapPin, Package, Building, ChevronRight, Film, Music, Gamepad, Book, Utensils, Globe, Tv, Search, Calendar, Star } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface EntityOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  location?: string;
  metadata?: {
    year?: string;
    creator?: string;
    distinguisher?: string;
  };
}

interface EntityDisambiguationProps {
  query: string;
  options: EntityOption[];
  onSelect: (option: EntityOption) => void;
  onBack: () => void;
  clarifyingQuestion?: string;
}

const categoryIcons: Record<string, any> = {
  Person: User,
  Place: MapPin,
  Product: Package,
  Business: Building,
  Movie: Film,
  Song: Music,
  Game: Gamepad,
  Book: Book,
  Restaurant: Utensils,
  Service: Globe,
  Show: Tv,
  "New Search": Search,
};

export const EntityDisambiguation = ({ 
  query, 
  options, 
  onSelect, 
  onBack,
  clarifyingQuestion 
}: EntityDisambiguationProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Which one did you mean?</h2>
        <p className="text-muted-foreground">
          {clarifyingQuestion || (
            <>
              We found several matches for "<span className="text-foreground font-medium">{query}</span>". 
              <br />Select the one you're looking for:
            </>
          )}
        </p>
      </motion.div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const Icon = categoryIcons[option.category] || User;
          const isNewSearch = option.id === "new";
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard
                variant="hover"
                className={`p-5 cursor-pointer group ${isNewSearch ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => onSelect(option)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    isNewSearch ? "bg-primary/20" : "bg-secondary/50"
                  }`}>
                    <Icon className={`w-7 h-7 ${isNewSearch ? "text-primary" : "text-foreground/70"}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{option.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs rounded-full shrink-0 ${
                        isNewSearch 
                          ? "bg-primary/20 text-primary" 
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {option.category}
                      </span>
                    </div>
                    
                    {option.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {option.description}
                      </p>
                    )}
                    
                    {/* Location */}
                    {option.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                        <MapPin className="w-3 h-3" />
                        {option.location}
                      </p>
                    )}
                    
                    {/* Metadata badges */}
                    {option.metadata && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {option.metadata.year && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            <Calendar className="w-3 h-3" />
                            {option.metadata.year}
                          </span>
                        )}
                        {option.metadata.creator && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">
                            <Star className="w-3 h-3" />
                            {option.metadata.creator}
                          </span>
                        )}
                        {option.metadata.distinguisher && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent-foreground">
                            {option.metadata.distinguisher}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onBack}
        className="w-full mt-6 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        ← Search for something else
      </motion.button>
    </div>
  );
};
