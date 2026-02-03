import { motion } from "framer-motion";
import { User, MapPin, Package, Building, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface EntityOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  location?: string;
  metadata?: Record<string, any>;
}

interface EntityDisambiguationProps {
  query: string;
  options: EntityOption[];
  onSelect: (option: EntityOption) => void;
  onBack: () => void;
}

const categoryIcons = {
  Person: User,
  Place: MapPin,
  Product: Package,
  Business: Building,
};

export const EntityDisambiguation = ({ 
  query, 
  options, 
  onSelect, 
  onBack 
}: EntityDisambiguationProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold mb-2">Multiple Results Found</h2>
        <p className="text-muted-foreground">
          We found several matches for "<span className="text-foreground">{query}</span>". 
          Please select the one you're looking for:
        </p>
      </motion.div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const Icon = categoryIcons[option.category as keyof typeof categoryIcons] || User;
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard
                variant="hover"
                className="p-4 cursor-pointer group"
                onClick={() => onSelect(option)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{option.name}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                        {option.category}
                      </span>
                    </div>
                    
                    {option.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {option.description}
                      </p>
                    )}
                    
                    {option.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {option.location}
                      </p>
                    )}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
